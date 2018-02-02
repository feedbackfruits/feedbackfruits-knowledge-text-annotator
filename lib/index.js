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
const Helpers = require("./helpers");
function annotate(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Annotating ${doc['@id']} with concepts`);
        const text = yield Helpers.docToText(doc);
        const { concepts, namedEntities } = yield Helpers.retrieveInformation(text);
        const tags = Helpers.conceptsToTags(concepts, doc["@id"]);
        const mappedCaptions = Helpers.mapCaptions(doc[Context.iris.$.caption], namedEntities);
        return Object.assign({}, doc, { [Context.iris.$.tag]: tags, [Context.iris.$.caption]: mappedCaptions });
    });
}
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            console.log('Received operation:', operation);
            const { action, data: doc } = operation;
            if (!(action === 'write') || !Helpers.isOperableDoc(doc))
                return;
            const annotatedDoc = yield annotate(doc);
            if (Helpers.isOperableDoc(annotatedDoc)) {
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
