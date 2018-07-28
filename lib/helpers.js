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
const create_index_1 = require("./create-index");
const PDF = require("./pdf");
function isOperableDoc(doc) {
    return (!hasTags(doc) || !hasAnnotations(doc)) && (hasCaptions(doc) || (isDocument(doc) && hasMedia(doc)));
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
function isDocument(doc) {
    return [].concat(doc["@type"]).indexOf(Engine.Context.iris.$.Document) != -1;
}
exports.isDocument = isDocument;
function hasMedia(doc) {
    return Engine.Context.iris.schema.encoding in doc && doc[Engine.Context.iris.schema.encoding].find(id => {
        return ((typeof id === 'string') ? id.indexOf(config_1.MEDIA_URL) : id["@id"].indexOf(config_1.MEDIA_URL)) === 0;
    });
}
exports.hasMedia = hasMedia;
function annotate(text, doc) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Retrieving information for text:', text);
        const { concepts, namedEntities } = yield retrieveInformation(text);
        const tags = conceptsToTags(concepts, doc["@id"]);
        const annotations = namedEntitiesToAnnotations(namedEntities, doc["@id"]);
        const annotated = Object.assign({}, doc, { [Engine.Context.iris.$.tag]: tags, [Engine.Context.iris.$.annotation]: annotations });
        const expanded = yield Engine.Doc.expand(annotated, Engine.Context.context);
        console.log('Returning annotated doc:', JSON.stringify(expanded));
        return expanded[0];
    });
}
exports.annotate = annotate;
function annotateVideo(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const [caption] = doc[Engine.Context.iris.$.caption];
        const [url] = caption["@id"].split('#');
        const captions = yield Engine.Captions.getCaptions(url);
        const text = yield Engine.Captions.toText(captions);
        const annotated = yield annotate(text, doc);
        const annotations = annotated[Engine.Context.iris.$.annotation] || [];
        if (annotations.length === 0)
            return annotated;
        const sdi = create_index_1.createIndex(annotated, captions);
        console.log('Created index:', JSON.stringify(sdi));
        const mappedAnnotations = annotations.map(annotation => {
            const id = annotation["@id"];
            const startDuration = sdi[id];
            return Object.assign({}, annotation, { "@type": [].concat(annotation["@type"], "VideoAnnotation"), [Engine.Context.iris.$.startDuration]: startDuration });
        });
        const withMappedAnnotations = Object.assign({}, annotated, { [Engine.Context.iris.$.annotation]: mappedAnnotations });
        return withMappedAnnotations;
    });
}
exports.annotateVideo = annotateVideo;
function annotateDocument(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const mediaUrlOrDoc = doc[Engine.Context.iris.schema.encoding].find(id => ((typeof id === 'string') ? id.indexOf(config_1.MEDIA_URL) : id["@id"].indexOf(config_1.MEDIA_URL)) === 0);
        const mediaUrl = typeof mediaUrlOrDoc === 'string' ? mediaUrlOrDoc : mediaUrlOrDoc["@id"];
        const pdfUrl = `${mediaUrl}/pdf.pdf`;
        const response = yield node_fetch_1.default(pdfUrl);
        const pdf = yield PDF.parse(response.body);
        const text = PDF.toText(pdf);
        const annotated = yield annotate(text, doc);
        const annotations = annotated[Engine.Context.iris.$.annotation] || [];
        if (annotations.length === 0)
            return annotated;
        const mappedAnnotations = (yield Promise.all(annotations.map(annotation => Engine.Doc.compact(annotation, Engine.Context.context))))
            .map((annotation) => {
            const id = annotation["@id"];
            const words = PDF.findAnnotation(pdf, annotation);
            const boundingBox = words.map(word => {
                const { "$": { xMin, yMin, xMax, yMax } } = word;
                return `${[xMin, yMin, xMax, yMax].join(" ")}`;
            });
            return Object.assign({}, annotation, { "@type": [].concat(annotation["@type"], "DocumentAnnotation"), [Engine.Context.iris.$.boundingBox]: boundingBox });
        });
        const withMappedAnnotations = Object.assign({}, annotated, { [Engine.Context.iris.$.annotation]: mappedAnnotations });
        return withMappedAnnotations;
    });
}
exports.annotateDocument = annotateDocument;
function generateId(...strings) {
    return `https://knowledge.express/tag#${new Buffer(strings.join('-')).toString('base64')}`;
}
exports.generateId = generateId;
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
