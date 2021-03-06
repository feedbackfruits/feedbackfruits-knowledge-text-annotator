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
const Config = require("./config");
const Helpers = require("./helpers");
function annotate(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Annotating ${doc['@id']} with concepts`);
        let annotated;
        if (Helpers.isDocument(doc)) {
            annotated = yield Helpers.annotateDocument(doc);
        }
        else if (Helpers.isWebPageResource(doc)) {
            annotated = yield Helpers.annotateWebPageResource(doc);
        }
        else {
            annotated = yield Helpers.annotateVideo(doc);
        }
        return annotated;
    });
}
const frames = [
    {
        "@context": feedbackfruits_knowledge_engine_1.Context.context,
        "@type": feedbackfruits_knowledge_engine_1.Context.iris.$.Resource
    }
];
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            console.log('Received operation:', operation);
            const { action, data: doc } = operation;
            yield Promise.all(frames.map((_frame) => __awaiter(this, void 0, void 0, function* () {
                const frame = Object.assign({ "@context": feedbackfruits_knowledge_engine_1.Context.context }, _frame);
                const framed = yield feedbackfruits_knowledge_engine_1.Doc.frame([].concat(doc), frame);
                if (framed.length === 0)
                    return;
                const expanded = yield feedbackfruits_knowledge_engine_1.Doc.expand(framed, feedbackfruits_knowledge_engine_1.Context.context);
                yield Promise.all(expanded.map((doc) => __awaiter(this, void 0, void 0, function* () {
                    console.log('Doc is operable?', Helpers.isOperableDoc(doc));
                    console.log('Expanded doc:', doc);
                    if (!(action === 'write') || !Helpers.isOperableDoc(doc))
                        return;
                    const annotatedDoc = yield annotate(doc);
                    if (Helpers.isOperableDoc(annotatedDoc))
                        return;
                    console.log('Sending annotated doc:', annotatedDoc);
                    try {
                        const result = yield send({ action: 'write', key: annotatedDoc['@id'], data: annotatedDoc });
                        return result;
                    }
                    catch (e) {
                        console.log('ERROR!');
                        console.error(e);
                        throw e;
                    }
                })));
            })));
            return;
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
