import { Operation } from 'memux';
import { Doc, Annotator, Config as _Config, Context } from 'feedbackfruits-knowledge-engine';
import * as Config from './config';
import * as Helpers from './helpers';

import { promises as jsonld } from 'jsonld';

async function annotate(doc: Doc): Promise<Doc> {
  console.log(`Annotating ${doc['@id']} with concepts`);

  let annotated;
  if (Helpers.isDocument(doc)) {
    annotated = await Helpers.annotateDocument(doc);
  } else {
    annotated = await Helpers.annotateVideo(doc);
  }

  return annotated;
}

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

const frame = {
  "@context": Context.context,
  "@type": Context.iris.$.Resource
};

export default async function init({ name }) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    console.log('Received operation:', operation);
    const { action, data: doc } = operation;
    // const { "@graph": framed } = await jsonld.frame(expanded, frame);
    const framed = await Doc.frame([].concat(doc), frame)
    const expanded = await Doc.expand(framed, Context.context);
    if (framed.length === 0) return; // Empty output ==> input 'rejected' by frame, not usable for this engine

    await Promise.all(expanded.map(async doc => {
      console.log('Doc is operable?', Helpers.isOperableDoc(doc));
      console.log('Expanded doc:', doc);
      if (!(action === 'write') || !Helpers.isOperableDoc(doc)) return;

      const annotatedDoc = await annotate(doc);
      if (Helpers.isOperableDoc(annotatedDoc)) return;
      console.log('Sending annotated doc:', annotatedDoc);

      try {
        const result = await send({ action: 'write', key: annotatedDoc['@id'], data: annotatedDoc });
        return result;
      } catch(e) {
        console.log('ERROR!');
        console.error(e);
        throw e;
      }
    }));

    return;
  }

  return await Annotator({
    name,
    receive,
    customConfig: Config as any as typeof _Config.Base
  });

}

// Start the server when executed directly
declare const require: any;
if (require.main === module) {
  console.log("Running as script.");
  init({
    name: Config.NAME,
  }).catch(console.error);
}
