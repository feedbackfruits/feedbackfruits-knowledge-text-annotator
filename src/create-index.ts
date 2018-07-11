import { Doc, Context, Captions } from 'feedbackfruits-knowledge-engine';

export function createIndex(doc: Doc, captions: Captions.Caption[]): { [index: string]: string } {
  const annotations = doc[Context.iris.$.annotation];
  console.log(`Creating index for ${doc["@id"]}: #captions=${captions.length} #annotations=${annotations.length}`)
  const withIndices = withIndex(captions);

  return withIndices.reduce((memo, caption) => {
    const found = annotations.filter(annotation => {
      const {
        [Context.iris.$.startPosition]: [ { "@value": startIndex } ],
        [Context.iris.$.detectedAs]: [ { "@value": detectedAs } ]
      } = annotation;
      const endIndex = startIndex + detectedAs.length;

      return (caption.startIndex >= startIndex && startIndex <= caption.endIndex) ||
        (caption.startIndex >= endIndex && endIndex <= caption.endIndex);
    });

    if (found.length === 0) return memo;
    const { startsAfter: startDuration } = caption;
    return {
      ...memo,
      ...(found.reduce((memo, annotation) => ({ ...memo, [annotation["@id"]]: startDuration}), {}))
    };
  }, {});
}

export function withIndex(captions: Captions.Caption[]): (Captions.Caption & { startIndex: number, endIndex: number })[] {
  const withIndices = captions.reduce((memo, caption, index) => {
    console.log(`Adding indices to caption:`, caption);
    const { baseIndex } = memo;
    const { text } = caption;
    const startIndex = baseIndex;

    // Add 1 for the spaces in between the captions, except on the last caption
    const endIndex = baseIndex + text.length + (index === captions.length - 1 ? 0 : 1 );

    return {
      baseIndex: endIndex,
      results: [
        ...memo.results,
        {
          ...caption,
          startIndex,
          endIndex
        }
      ]
    };
  }, { baseIndex: 0, results: [] }).results;

  return withIndices;
}
