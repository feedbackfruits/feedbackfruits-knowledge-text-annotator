import test from 'ava';
import * as fs from 'fs';

const video = require('./video.json');
const document = require('./document/doc.json');
const documentText = fs.readFileSync(__dirname + '/document/text.txt').toString();
// const { text: documentText } = require('./document/text.json');
const documentTags = require('./document/tags.json');
const documentAnnotations = require('./document/annotations.json');
// const { text: documentText } = require('./document/text.json');
const concepts = require('./concepts');
const namedEntities = require('./named-entities');

const tags = require('./tags');
const annotations = require('./annotations');
const captionText = video.caption.map(caption => caption.text).join(' ');

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
  video,
  document,
  documentText,
  captionText,
  concepts,
  namedEntities,
  tags,
  annotations,
  documentTags,
  documentAnnotations,
}

// This is a bit hacky, but ava complains otherwise
test('support', t => {
  t.pass();
});
