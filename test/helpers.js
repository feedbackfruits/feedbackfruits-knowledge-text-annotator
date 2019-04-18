import * as fs from 'fs';
import test from 'ava';
import * as Helpers from '../lib/helpers';

import * as Support from './support';

test('it exists', t => {
  t.not(Helpers, undefined);
});

// test('textToMedia: it converts text to media', async t => {
//   const result = await Helpers.textToMedia(Support.captionText);
//   return t.deepEqual(result, {});
// });

test('getConcepts: it converts text to concepts', async t => {
  const result = await Helpers.retrieveInformation(Support.Undercovered.pdfText);
  const { concepts, namedEntities } = result;
  // console.log(JSON.stringify(result))
  // fs.writeFileSync('bla.json', JSON.stringify(result));
  t.deepEqual(Support.sortConcepts(concepts), Support.sortConcepts(Support.Undercovered.concepts));
  return t.deepEqual(Support.sortNamedEntities(namedEntities), Support.sortNamedEntities(Support.Undercovered.namedEntities));
});

// test('conceptsToTags: it converts concepts to tags for a resource', async t => {
//   const result = await Helpers.conceptsToTags(Support.Document2.concepts, Support.Document2.doc["@id"]);
//   console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.Document2.tags);
// });

// test('getNamedEntities: it converts text and concepts to named entities', async t => {
//   const result = await Helpers.getNamedEntities(Support.captionText, Support.concepts);
//   // console.log(JSON.stringify(result))
//   return t.deepEqual(Support.sortNamedEntities(result), Support.sortNamedEntities(Support.namedEntities));
// });

// test('namedEntitiesToAnnotations: it converts named entities to annotations for a resource', async t => {
//   const result = await Helpers.namedEntitiesToAnnotations(Support.Document.namedEntities, Support.Document.doc['@id']);
//   console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.Document.annotations);
// });
