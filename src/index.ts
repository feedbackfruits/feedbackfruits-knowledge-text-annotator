import { Operation } from 'memux';
import { Doc, Annotator, Config as _Config, Context } from 'feedbackfruits-knowledge-engine';
import * as Config from './config';
import * as Helpers from './helpers';

async function annotate(doc: Doc): Promise<Doc> {
  console.log(`Annotating ${doc['@id']} with concepts`);

  const annotated = await Helpers.annotateVideo(doc);
  return annotated;
  // const unflattened = await Doc.unflatten(doc, Context.context);

  // const text = await Helpers.docToText(doc);
  // const { concepts, namedEntities } = await Helpers.retrieveInformation(text);
  // const tags = Helpers.conceptsToTags(concepts, doc["@id"]);
  // const mappedCaptions = Helpers.mapCaptions(doc[Context.iris.$.caption], namedEntities);

  // return {
  //   ...doc,
  //   [Context.iris.$.tag]: tags,
  //   [Context.iris.$.caption]: mappedCaptions
  // };
}

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

export default async function init({ name }) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    console.log('Received operation:', operation);
    const { action, data: doc } = operation;
    if (!(action === 'write') || !Helpers.isOperableDoc(doc)) return;

    const annotatedDoc = await annotate(doc);
    if (Helpers.isOperableDoc(annotatedDoc)) {
      console.error('Doc still operable after annotation. Something went wrong?');
      return;
    }

    return send({ action: 'write', key: annotatedDoc['@id'], data: annotatedDoc });
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
