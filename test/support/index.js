import test from 'ava';

const doc = require('./doc.json');

const concepts = require('./concepts');
const namedEntities = require('./named-entities');

const tags = require('./tags');
const annotations = require('./annotations');
const captionText = doc.caption.map(caption => caption.text).join(' ');

export function sortConcepts(concepts) {
  return concepts.sort((a, b) => a.dbpedia_resource.localeCompare(b.dbpedia_resource));
}

export function sortNamedEntities(namedEntities) {
  return namedEntities.sort((a, b) => a["@URI"].localeCompare(b["@URI"]));
}

export {
  doc,
  captionText,
  concepts,
  namedEntities,
  tags,
  annotations,
}

// This is a bit hacky, but ava complains otherwise
test('support', t => {
  t.pass();
});
