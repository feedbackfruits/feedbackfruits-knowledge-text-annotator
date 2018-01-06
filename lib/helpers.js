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
const Context = require("feedbackfruits-knowledge-context");
const config_1 = require("./config");
function isOperableDoc(doc) {
    return (!hasTags(doc) || !hasAnnotations(doc)) && (hasCaptions(doc) || hasText(doc));
}
exports.isOperableDoc = isOperableDoc;
function hasCaptions(doc) {
    return Context.graph.$.caption in doc;
}
exports.hasCaptions = hasCaptions;
function hasText(doc) {
    return Context.graph.schema.text in doc;
}
exports.hasText = hasText;
function hasTags(doc) {
    return Context.graph.$.tag in doc;
}
exports.hasTags = hasTags;
function hasAnnotations(doc) {
    return Context.graph.$.annotation in doc;
}
exports.hasAnnotations = hasAnnotations;
function generateId(...strings) {
    return new Buffer(strings.join('-')).toString('base64');
}
exports.generateId = generateId;
function docToText(doc) {
    if (hasText(doc))
        return doc[Context.graph.schema.text];
    return doc[Context.graph.$.caption].map(caption => caption.text).join(' ');
}
exports.docToText = docToText;
function getConcepts(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = new Buffer(`${config_1.WATSON_USERNAME}:${config_1.WATSON_PASSWORD}`).toString('base64');
        const response = yield node_fetch_1.default(config_1.WATSON_URL, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                version: '2017-02-27',
                text: text.replace(/[^\w]/g, ' ').trim(),
                features: {
                    concepts: {},
                }
            })
        });
        const result = yield response.json();
        return result.concepts;
    });
}
exports.getConcepts = getConcepts;
function getNamedEntities(text, concepts) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = `text=${encodeURIComponent(text)}&confidence=0.5&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=&sparql=${encodeURIComponent(`
  SELECT * WHERE {
    ${concepts.map(concept => `{
      SELECT * WHERE {
      values ?uri { '${concept.dbpedia_resource}' }
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
        let result;
        const resText = yield response.text();
        try {
            result = JSON.parse(resText);
        }
        catch (e) {
            console.log(resText);
            throw new Error('Error parsing JSON response: ' + resText);
        }
        if (!('Resources' in result))
            return [];
        return result.Resources;
    });
}
exports.getNamedEntities = getNamedEntities;
function conceptsToTags(concepts, resourceId) {
    return concepts.map(concept => {
        return {
            resource: { id: resourceId },
            entity: { id: concept.dbpedia_resource },
            score: concept.relevance,
        };
    }).map(partialTag => (Object.assign({ id: generateId(...[partialTag.resource.id, partialTag.entity.id]) }, partialTag)));
}
exports.conceptsToTags = conceptsToTags;
function namedEntitiesToAnnotations(namedEntities, resourceId) {
    return namedEntities.map(resource => {
        return {
            resource: { id: resourceId },
            entity: { id: feedbackfruits_knowledge_engine_1.Helpers.encodeIRI(resource["@URI"]) },
            score: parseFloat(resource["@similarityScore"]),
            detectedAs: resource["@surfaceForm"],
            startPosition: parseInt(resource["@offset"])
        };
    }).map(partialAnnotation => (Object.assign({ id: generateId(...[partialAnnotation.resource.id, partialAnnotation.entity.id, partialAnnotation.startPosition, partialAnnotation.detectedAs]) }, partialAnnotation)));
}
exports.namedEntitiesToAnnotations = namedEntitiesToAnnotations;
