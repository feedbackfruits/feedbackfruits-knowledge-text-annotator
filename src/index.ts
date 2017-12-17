import { Operation } from 'memux';
import { Doc, Annotator, Helpers, Config as _Config } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import * as Config from './config';
import { textToConcepts, isOperableDoc } from './helpers';

async function annotate(doc: Doc): Promise<Doc> {
  console.log(`Annotating ${doc['@id']} with concepts`);
  const concepts = await textToConcepts([].concat(doc[Helpers.decodeIRI(Context.graph.schema.text)])[0]);
  // console.log('Converted text to concepts:', concepts);
  if (concepts.length === 0) return doc;
  return {
    ...doc,
    [Helpers.decodeIRI(Context.graph.schema.about)]: concepts
  };
}

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

export default async function init({ name }) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    console.log('Received operation:', operation);
    const { action, data: doc } = operation;
    if (!(action === 'write') || !isOperableDoc(doc)) return;

    const annotatedDoc = await annotate(doc);
    if (isOperableDoc(annotatedDoc)) return;

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
