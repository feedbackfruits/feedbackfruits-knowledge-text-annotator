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
const Engine = require("feedbackfruits-knowledge-engine");
const config_1 = require("./config");
function isOperableDoc(doc) {
    return (!hasTags(doc) || !hasAnnotations(doc)) && (hasCaptions(doc));
}
exports.isOperableDoc = isOperableDoc;
function hasCaptions(doc) {
    return Engine.Context.iris.$.caption in doc;
}
exports.hasCaptions = hasCaptions;
function hasText(doc) {
    return Engine.Context.iris.schema.text in doc;
}
exports.hasText = hasText;
function hasTags(doc) {
    return Engine.Context.iris.$.tag in doc;
}
exports.hasTags = hasTags;
function hasAnnotations(doc) {
    return Engine.Context.iris.$.annotation in doc;
}
exports.hasAnnotations = hasAnnotations;
function annotateVideo(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield docToText(doc);
        console.log('Retrieving information for text:', text);
        const { concepts, namedEntities } = yield retrieveInformation(text);
        const tags = conceptsToTags(concepts, doc["@id"]);
        const compacted = yield Promise.all(doc[Engine.Context.iris.$.caption]
            .map(caption => Engine.Doc.compact(caption, Engine.Context.context)));
        const annotations = namedEntitiesToAnnotations(namedEntities, doc["@id"]);
        const annotated = Object.assign({}, doc, { [Engine.Context.iris.$.tag]: tags, [Engine.Context.iris.$.annotation]: annotations });
        const expanded = yield Engine.Doc.expand(annotated, Engine.Context.context);
        console.log('Returning annotated doc:', JSON.stringify(expanded));
        return expanded[0];
    });
}
exports.annotateVideo = annotateVideo;
function generateId(...strings) {
    return `https://knowledge.express/tag#${new Buffer(strings.join('-')).toString('base64')}`;
}
exports.generateId = generateId;
function mapCaptions(captions, namedEntities) {
    const withIndices = captions.reduce((memo, caption, index) => {
        const { baseIndex } = memo;
        const { text } = caption;
        const startIndex = baseIndex;
        const endIndex = baseIndex + text.length + (index === captions.length - 1 ? 0 : 1);
        return {
            baseIndex: endIndex,
            results: [
                ...memo.results,
                Object.assign({}, caption, { startIndex,
                    endIndex })
            ]
        };
    }, { baseIndex: 0, results: [] }).results;
    return withIndices.map(caption => {
        const entities = namedEntities.filter(entity => {
            const startIndex = entity["@offset"];
            const endIndex = startIndex + entity["@surfaceForm"].length;
            return (caption.startIndex >= startIndex && startIndex <= caption.endIndex) ||
                (caption.startIndex >= endIndex && endIndex <= caption.endIndex);
        });
        const newCaption = caption;
        delete newCaption.startIndex;
        delete newCaption.endIndex;
        if (entities.length === 0)
            return newCaption;
        const annotations = namedEntitiesToAnnotations(entities, caption["@id"]);
        return Object.assign({}, newCaption, { [Engine.Context.iris.$.annotation]: annotations });
    });
}
exports.mapCaptions = mapCaptions;
function docToText(doc) {
    if (hasText(doc))
        return doc[Engine.Context.iris.schema.text];
    return doc[Engine.Context.iris.$.caption].reduce((memo, caption) => [...memo, ...[].concat(caption[Engine.Context.iris.schema.text])], []).map(doc => doc["@value"]).join(' ');
}
exports.docToText = docToText;
function retrieveInformation(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(`${config_1.RETRIEVE_URL}/text?concepts&namedEntities`, {
            method: 'post',
            headers: {
                'Content-type': 'text/plain'
            },
            body: text
        });
        const result = yield response.json();
        console.log('Received ir:', JSON.stringify(result));
        return result;
    });
}
exports.retrieveInformation = retrieveInformation;
function conceptsToTags(concepts, taggableId) {
    return concepts.map(concept => {
        return {
            "@type": [Engine.Context.iris.$.Tag],
            tagOf: taggableId,
            about: {
                "@id": concept.dbpedia_resource,
                "@type": Engine.Context.iris.$.Entity
            },
            score: concept.relevance,
        };
    }).map(partialTag => (Object.assign({ "@id": generateId(...[partialTag.tagOf, partialTag.about["@id"]]) }, partialTag)));
}
exports.conceptsToTags = conceptsToTags;
function namedEntitiesToAnnotations(namedEntities, taggableId) {
    return namedEntities.map(resource => {
        return {
            "@type": [Engine.Context.iris.$.Annotation],
            tagOf: taggableId,
            about: {
                "@id": resource["@URI"],
                "@type": Engine.Context.iris.$.Entity
            },
            score: parseFloat(resource["@similarityScore"]),
            detectedAs: resource["@surfaceForm"],
            startPosition: parseInt(resource["@offset"])
        };
    }).map(partialAnnotation => (Object.assign({ "@id": generateId(...[partialAnnotation.tagOf, partialAnnotation.about["@id"], partialAnnotation.startPosition, partialAnnotation.detectedAs]) }, partialAnnotation)));
}
exports.namedEntitiesToAnnotations = namedEntitiesToAnnotations;
