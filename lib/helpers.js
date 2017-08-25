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
const wikipediaRegex = /^https:\/\/en\.wikipedia\.org\/wiki\/(.*)$/;
function isOperableDoc(doc) {
    return (feedbackfruits_knowledge_engine_1.Helpers.decodeIRI(Context.text) in doc) && !(feedbackfruits_knowledge_engine_1.Helpers.decodeIRI(Context.about) in doc);
}
exports.isOperableDoc = isOperableDoc;
function textToConcepts(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(config_1.EXTRACTOR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ text })
        });
        const entities = yield response.json();
        return parseEntities(entities.concepts);
    });
}
exports.textToConcepts = textToConcepts;
function parseEntities(entities) {
    return deduplicate(entities.map(entity => {
        const match = entity.link.match(wikipediaRegex);
        const id = match[1];
        return feedbackfruits_knowledge_engine_1.Helpers.iriify(`http://dbpedia.org/resource/${id}`);
    }));
}
exports.parseEntities = parseEntities;
function deduplicate(strings) {
    return Object.keys(strings.reduce((memo, str) => Object.assign(memo, { [str]: true }), {}));
}
exports.deduplicate = deduplicate;
