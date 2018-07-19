import { Doc, Context, Captions } from 'feedbackfruits-knowledge-engine';

export function createIndex(doc: Doc, captions: Captions.Caption[]): { [index: string]: string } {
  const annotations = doc[Context.iris.$.annotation];
  // console.log(`Creating index for ${doc["@id"]}: #captions=${captions.length} #annotations=${annotations.length}`)
  const withIndices = withIndex(captions);

  return withIndices.reduce((memo, caption) => {
    const found = annotations.filter(annotation => {
      const {
        [Context.iris.$.startPosition]: [ { "@value": startIndex } ],
        [Context.iris.$.detectedAs]: [ { "@value": detectedAs } ]
      } = annotation;
      const endIndex = startIndex + detectedAs.length;

      // The annotation starts in this caption if the startIndex of the annotation falls within the caption
      const startsInCaption = (startIndex >= caption.startIndex && startIndex <= caption.endIndex);

      // console.log(`Found for annotation ${annotation["@id"]} with indices ${startIndex} to ${endIndex} in ${caption["@id"]}?:`, startsInCaption);

      return startsInCaption;
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
    const { baseIndex } = memo;
    const { text } = caption;
    const startIndex = baseIndex;

    // Add 1 for the spaces in between the captions, except on the last caption
    const endIndex = baseIndex + text.length + (index === captions.length - 1 ? 0 : 1 );
    // console.log(`Adding indices ${startIndex} to ${endIndex} caption ${caption["@id"]}`);

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
