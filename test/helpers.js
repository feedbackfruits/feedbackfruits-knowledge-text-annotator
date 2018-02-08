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

// test('getConcepts: it converts text to concepts', async t => {
//   const result = await Helpers.getConcepts(Support.captionText);
//   // console.log(JSON.stringify(result))
//   return t.deepEqual(Support.sortConcepts(result), Support.sortConcepts(Support.concepts));
// });
//
// test('conceptsToTags: it converts concepts to tags for a resource', async t => {
//   const result = await Helpers.conceptsToTags(Support.concepts, Support.doc['@id']);
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.tags);
// });
//
// test('getNamedEntities: it converts text and concepts to named entities', async t => {
//   const result = await Helpers.getNamedEntities(Support.captionText, Support.concepts);
//   // console.log(JSON.stringify(result))
//   return t.deepEqual(Support.sortNamedEntities(result), Support.sortNamedEntities(Support.namedEntities));
// });
//
// test('namedEntitiesToAnnotations: it converts named entities to annotations for a resource', async t => {
//   const result = await Helpers.namedEntitiesToAnnotations(Support.namedEntities, Support.doc['@id']);
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.annotations);
// });
