"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
function createIndex(doc, captions) {
    const annotations = doc[feedbackfruits_knowledge_engine_1.Context.iris.$.annotation];
    const withIndices = withIndex(captions);
    return withIndices.reduce((memo, caption) => {
        const found = annotations.filter(annotation => {
            const { [feedbackfruits_knowledge_engine_1.Context.iris.$.startPosition]: [{ "@value": startIndex }], [feedbackfruits_knowledge_engine_1.Context.iris.$.detectedAs]: [{ "@value": detectedAs }] } = annotation;
            const endIndex = startIndex + detectedAs.length;
            const startsInCaption = (startIndex >= caption.startIndex && startIndex <= caption.endIndex);
            return startsInCaption;
        });
        if (found.length === 0)
            return memo;
        const { startsAfter: startDuration } = caption;
        return Object.assign({}, memo, (found.reduce((memo, annotation) => (Object.assign({}, memo, { [annotation["@id"]]: startDuration })), {})));
    }, {});
}
exports.createIndex = createIndex;
function withIndex(captions) {
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
    return withIndices;
}
exports.withIndex = withIndex;
