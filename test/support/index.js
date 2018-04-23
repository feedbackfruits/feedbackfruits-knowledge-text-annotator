import test from 'ava';

const doc = require('./doc.json');

const concepts = require('./concepts');
const namedEntities = require('./named-entities');

const tags = require('./tags');
const annotations = require('./annotations');
const relevance = require('./relevance');
const captionText = doc.caption.map(caption => caption.text).join(' ');

export function sortConcepts(concepts) {
  return concepts.sort((a, b) => a.dbpedia_resource.localeCompare(b.dbpedia_resource));
}

export function sortNamedEntities(namedEntities) {
  return namedEntities.sort((a, b) => a["@URI"].localeCompare(b["@URI"]));
}

export function sortArray(docs) {
  return docs.sort((a, b) => {
    if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
    return a["@id"].localeCompare(b["@id"]);
  });
}

export {
  doc,
  captionText,
  concepts,
  namedEntities,
  tags,
  annotations,
  relevance,
}

// This is a bit hacky, but ava complains otherwise
test('support', t => {
  t.pass();
});
