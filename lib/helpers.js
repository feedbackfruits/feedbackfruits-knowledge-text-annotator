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
const Context = require("feedbackfruits-knowledge-context");
const config_1 = require("./config");
function isOperableDoc(doc) {
    return (!hasTags(doc) || !hasAnnotations(doc)) && (hasCaptions(doc) || hasText(doc));
}
exports.isOperableDoc = isOperableDoc;
function hasCaptions(doc) {
    return Context.iris.$.caption in doc;
}
exports.hasCaptions = hasCaptions;
function hasText(doc) {
    return Context.iris.schema.text in doc;
}
exports.hasText = hasText;
function hasTags(doc) {
    return Context.iris.$.tag in doc;
}
exports.hasTags = hasTags;
function hasAnnotations(doc) {
    return Context.iris.$.annotation in doc;
}
exports.hasAnnotations = hasAnnotations;
function annotateVideo(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield docToText(doc);
        const { concepts, namedEntities } = yield retrieveInformation(text);
        const tags = conceptsToTags(concepts, doc["@id"]);
        const mappedCaptions = mapCaptions(doc[Context.iris.$.caption], namedEntities);
        return Object.assign({}, doc, { [Context.iris.$.tag]: tags, [Context.iris.$.caption]: mappedCaptions });
    });
}
exports.annotateVideo = annotateVideo;
function generateId(...strings) {
    return new Buffer(strings.join('-')).toString('base64');
}
exports.generateId = generateId;
function captionsForRange(captions, startIndex, endIndex) {
    return captions.reduce((memo, caption) => {
        if (caption.startIndex >= startIndex && startIndex <= caption.endIndex) {
            memo.push(caption);
        }
        if (caption.startIndex >= endIndex && endIndex <= caption.endIndex) {
            memo.push(caption);
        }
        return memo;
    }, []);
}
exports.captionsForRange = captionsForRange;
function mapCaptions(captions, namedEntities) {
    const withIndices = captions.reduce((memo, caption) => {
        const { baseIndex } = memo;
        const { text } = caption;
        const startIndex = baseIndex;
        const endIndex = baseIndex + text.length;
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
        if (entities.length === 0)
            return caption;
        const annotations = namedEntitiesToAnnotations(entities, caption["@id"]);
        return Object.assign({}, caption, { [Context.iris.$.annotation]: annotations });
    });
}
exports.mapCaptions = mapCaptions;
function docToText(doc) {
    if (hasText(doc))
        return doc[Context.iris.schema.text];
    return doc[Context.iris.$.caption].map(caption => caption.text).join(' ');
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
        return result;
    });
}
exports.retrieveInformation = retrieveInformation;
function conceptsToTags(concepts, taggableId) {
    return concepts.map(concept => {
        return {
            tagOf: [taggableId],
            about: concept.dbpedia_resource,
            score: concept.relevance,
        };
    }).map(partialTag => (Object.assign({ "@id": generateId(...[partialTag.tagOf[0], partialTag.about]) }, partialTag)));
}
exports.conceptsToTags = conceptsToTags;
function namedEntitiesToAnnotations(namedEntities, taggableId) {
    return namedEntities.map(resource => {
        return {
            tagOf: [taggableId],
            about: resource["@URI"],
            score: parseFloat(resource["@similarityScore"]),
            detectedAs: resource["@surfaceForm"],
            startPosition: parseInt(resource["@offset"])
        };
    }).map(partialAnnotation => (Object.assign({ "@id": generateId(...[partialAnnotation.tagOf[0], partialAnnotation.about, partialAnnotation.startPosition, partialAnnotation.detectedAs]) }, partialAnnotation)));
}
exports.namedEntitiesToAnnotations = namedEntitiesToAnnotations;
