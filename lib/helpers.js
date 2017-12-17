"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
const config_1 = require("./config");
const wikipediaRegex = /^https:\/\/en\.wikipedia\.org\/wiki\/(.*)$/;
function isOperableDoc(doc) {
    return ('http://schema.org/text' in doc) && !('https://schema.org/about' in doc);
}
exports.isOperableDoc = isOperableDoc;
function annotateText(text, concepts) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = `text=${encodeURIComponent(text)}&confidence=0.5&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=&sparql=${encodeURIComponent(`
  SELECT * WHERE {
    ${concepts.map(concept => `{
      SELECT * WHERE {
      values ?uri { ${concept.id} }
      }
    }`).join(' UNION ')}
  }
`)}`;
        const response = yield node_fetch_1.default(config_1.ANNOTATOR_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/x-www-form-urlencoded',
            },
            body: body
        });
        const result = yield response.json();
        if (!('Resources' in result))
            return [];
        const annotations = result.Resources.map((resource) => {
            return {
                entity: { id: feedbackfruits_knowledge_engine_1.Helpers.encodeIRI(resource["@URI"]) },
                score: parseFloat(resource["@similarityScore"]),
                detectedAs: resource["@surfaceForm"],
                startPosition: parseInt(resource["@offset"])
            };
        });
        return annotations;
    });
}
exports.annotateText = annotateText;
function textToConcepts(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(config_1.EXTRACTOR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ text: text.replace(/[^\w]/g, ' ').trim() })
        });
        const resText = yield response.text();
        let entities;
        try {
            entities = (resText == '' || !resText) ? { concepts: [] } : JSON.parse(resText);
        }
        catch (error) {
            console.log("ERROR! TEXT:", resText);
            throw error;
        }
        return parseEntities(entities.concepts);
    });
}
exports.textToConcepts = textToConcepts;
function parseEntities(entities) {
    return deduplicate(entities.map(entity => {
        const match = entity.link.match(wikipediaRegex);
        const id = match[1];
        return feedbackfruits_knowledge_engine_1.Helpers.iriify(`http://dbpedia.org/resource/${id}`);
    })).map(id => ({ id }));
}
exports.parseEntities = parseEntities;
function deduplicate(strings) {
    return Object.keys(strings.reduce((memo, str) => Object.assign(memo, { [str]: true }), {}));
}
exports.deduplicate = deduplicate;
