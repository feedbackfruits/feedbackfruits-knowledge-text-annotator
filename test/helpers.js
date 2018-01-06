import test from 'ava';
import * as Helpers from '../lib/helpers';

const doc = require('./support/doc');
const captions = require('./support/captions');
const captionText = captions.map(caption => caption.text).join(' ');

const concepts = require('./support/concepts');
const namedEntities = require('./support/named-entities');

const tags = require('./support/tags');
const annotations = require('./support/annotations');

test('it exists', t => {
  t.not(Helpers, undefined);
});

// test('textToMedia: it converts text to media', async t => {
//   const result = await Helpers.textToMedia(captionText);
//   return t.deepEqual(result, {});
// });

test('getConcepts: it converts text to concepts', async t => {
  const result = await Helpers.getConcepts(captionText);
  // console.log(JSON.stringify(result))
  return t.deepEqual(result, concepts);
});

test('conceptsToTags: it converts concepts to tags for a resource', async t => {
  const result = await Helpers.conceptsToTags(concepts, doc['@id']);
  return t.deepEqual(result, tags);
});

test('getNamedEntities: it converts text and concepts to named entities', async t => {
  const result = await Helpers.getNamedEntities(captionText, concepts);
  // console.log(JSON.stringify(result))
  return t.deepEqual(result, namedEntities);
});

test('namedEntitiesToAnnotations: it converts named entities to annotations for a resource', async t => {
  const result = await Helpers.namedEntitiesToAnnotations(namedEntities, doc['@id']);
  // console.log(JSON.stringify(result))
  return t.deepEqual(result, annotations);
});
