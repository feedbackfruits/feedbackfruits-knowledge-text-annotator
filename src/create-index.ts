import { Doc, Context } from 'feedbackfruits-knowledge-engine';

export function createIndex(doc: Doc): { [index: string]: string } {
  const captions = doc[Context.iris.$.caption];
  const annotations = doc[Context.iris.$.annotation];
  const withIndices = withIndex(captions);

  return withIndices.reduce((memo, caption) => {
    const found = annotations.filter(annotation => {
      const startIndex = annotation[Context.iris.$.startPosition];
      const endIndex = startIndex + annotation[Context.iris.$.detectedAs].length;

      return (caption.startIndex >= startIndex && startIndex <= caption.endIndex) ||
        (caption.startIndex >= endIndex && endIndex <= caption.endIndex);
    });

    if (found.length === 0) return memo;
    return {
      ...memo,
      ...(found.reduce((memo, annotation) => ({ ...memo, [annotation["@id"]]: caption[Context.iris.$.startDuration]}), {}))
    };
  }, {});
}

export function withIndex(captions) {
  const withIndices = captions.reduce((memo, caption, index) => {
    // console.log(`Adding indices to caption:`, caption);
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
