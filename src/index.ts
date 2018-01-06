import { Operation } from 'memux';
import { Doc, Annotator, Helpers, Config as _Config } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import * as Config from './config';
import { docToText, getConcepts, getNamedEntities, conceptsToTags, namedEntitiesToAnnotations, isOperableDoc } from './helpers';

async function annotate(doc: Doc): Promise<Doc> {
  console.log(`Annotating ${doc['@id']} with concepts`);
  const text = docToText(doc);

  const concepts = await getConcepts(text);
  if (concepts.length === 0) return doc;
  console.log('Converted text to concepts:', concepts);

  const namedEntities = await getNamedEntities(text, concepts);
  console.log('Named entities found:', namedEntities);

  const tags = conceptsToTags(concepts, doc['@id']);
  const annotations = namedEntitiesToAnnotations(namedEntities, doc['@id']);
  console.log('Returning annotated doc.');

  return <Doc>{
    ...doc,
    [Context.graph.$.tag]: tags,
    [Context.graph.$.annotation]: annotations,
  };
}

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

export default async function init({ name }) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    console.log('Received operation:', operation);
    const { action, data: doc } = operation;
    if (!(action === 'write') || !isOperableDoc(doc)) return;

    const annotatedDoc = await annotate(doc);
    if (isOperableDoc(annotatedDoc)) {
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
