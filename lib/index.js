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
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
const Context = require("feedbackfruits-knowledge-context");
const Config = require("./config");
const helpers_1 = require("./helpers");
function annotate(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Annotating ${doc['@id']} with concepts`);
        const text = helpers_1.docToText(doc);
        const concepts = yield helpers_1.getConcepts(text);
        if (concepts.length === 0)
            return doc;
        console.log('Converted text to concepts:', concepts);
        const namedEntities = yield helpers_1.getNamedEntities(text, concepts);
        console.log('Named entities found:', namedEntities);
        const tags = helpers_1.conceptsToTags(concepts, doc['@id']);
        const annotations = helpers_1.namedEntitiesToAnnotations(namedEntities, doc['@id']);
        console.log('Returning annotated doc.');
        return Object.assign({}, doc, { [Context.graph.$.tag]: tags, [Context.graph.$.annotation]: annotations });
    });
}
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            console.log('Received operation:', operation);
            const { action, data: doc } = operation;
            if (!(action === 'write') || !helpers_1.isOperableDoc(doc))
                return;
            const annotatedDoc = yield annotate(doc);
            if (helpers_1.isOperableDoc(annotatedDoc)) {
                console.error('Doc still operable after annotation. Something went wrong?');
                return;
            }
            return send({ action: 'write', key: annotatedDoc['@id'], data: annotatedDoc });
        });
        return yield feedbackfruits_knowledge_engine_1.Annotator({
            name,
            receive,
            customConfig: Config
        });
    });
}
exports.default = init;
if (require.main === module) {
    console.log("Running as script.");
    init({
        name: Config.NAME,
    }).catch(console.error);
}
