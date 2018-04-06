import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import * as Engine from 'feedbackfruits-knowledge-engine';
import { RETRIEVE_URL } from './config';

export function isOperableDoc(doc: Engine.Doc): doc is Engine.Doc & ({ ['https://knowledge.express/caption']: Array<Object> } | { ['http://schema.org/text']: string }) {
  return (!hasTags(doc) || !hasAnnotations(doc) ) && (hasCaptions(doc) || hasText(doc));
}

export function hasCaptions(doc: Engine.Doc): doc is Engine.Doc & { ['https://knowledge.express/caption']: string } {
  return Engine.Context.iris.$.caption in doc;
}

export function hasText(doc: Engine.Doc): doc is Engine.Doc & { ['http://schema.org/text']: string } {
  return Engine.Context.iris.schema.text in doc;
}

export function hasTags(doc: Engine.Doc): doc is Engine.Doc & { ['https://knowledge.express/tag']: string } {
  return Engine.Context.iris.$.tag in doc;
}

export function hasAnnotations(doc: Engine.Doc): doc is Engine.Doc & { ['https://knowledge.express/annotation']: string } {
  return Engine.Context.iris.$.annotation in doc;
}

export type Caption = {
  "@id": string,
  "@type": string[];
  text: string
};

export type Concept = {
  text: string;
  relevance: number;
  dbpedia_resource: string;
};

export type Tag = {
  "@id": string;
  "@type": string[];
  tagOf: string;
  about: {
    "@id": string;
    "@type": string;
  };
  score: number;
};

export type Annotation = Tag & {
  confidence?: number;
  detectedAs: string;
  startPosition: number;
};

export type Partial<T> = {
    [P in keyof T]?: T[P];
};

export type DBPediaResource =   {
  "@URI": string,
  "@support": string,
  "@types": string,
  "@surfaceForm": string,
  "@offset": string,
  "@similarityScore": string,
  "@percentageOfSecondRank": string
};

export async function annotateVideo(doc: Engine.Doc): Promise<Engine.Doc> {
  const text = await docToText(doc);
  const { concepts, namedEntities } = await retrieveInformation(text);
  const tags = conceptsToTags(concepts, doc["@id"]);
  const compacted = await Promise.all<Caption>(doc[Engine.Context.iris.$.caption]
    .map(caption => Engine.Doc.compact(caption, Engine.Context.context)));
  const annotations = namedEntitiesToAnnotations(namedEntities, doc["@id"]);
  // const mappedCaptions = mapCaptions(compacted, namedEntities);

  const annotated = {
    ...doc,
    [Engine.Context.iris.$.tag]: tags,
    [Engine.Context.iris.$.annotation]: annotations,
    // [Engine.Context.iris.$.caption]: mappedCaptions
  };

  const expanded = await Engine.Doc.expand(annotated, Engine.Context.context);
  console.log('Returning annotated doc:', JSON.stringify(expanded));
  return expanded[0]; // Expanded returns an array, we are only expecting one doc. This will be fixed in the future by flattening docs
}

export function generateId(...strings: Array<string | number>): string {
  return `https://knowledge.express/tag#${new Buffer(strings.join('-')).toString('base64')}`;
}

// Returns all the captions that overlap with the range
// export function captionsForRange(captions, startIndex, endIndex) {
//   return captions.reduce((memo, caption) => {
//     if (caption.startIndex >= startIndex && startIndex <= caption.endIndex) {
//       memo.push(caption);
//     }
//
//     if (caption.startIndex >= endIndex && endIndex <= caption.endIndex) {
//       memo.push(caption);
//     }
//
//     return memo;
//   }, []);
// }

export function mapCaptions(captions: Caption[], namedEntities: DBPediaResource[]): Caption[] {
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

  return withIndices.map(caption => {
    const entities = namedEntities.filter(entity => {
      const startIndex = entity["@offset"];
      const endIndex = startIndex + entity["@surfaceForm"].length;

      return (caption.startIndex >= startIndex && startIndex <= caption.endIndex) ||
        (caption.startIndex >= endIndex && endIndex <= caption.endIndex);
    });

    const newCaption = caption;
    delete newCaption.startIndex;
    delete newCaption.endIndex;


    if (entities.length === 0) return newCaption;
    const annotations = namedEntitiesToAnnotations(entities, caption["@id"]);
    return {
      ...newCaption,
      [Engine.Context.iris.$.annotation]: annotations
    };
  });
}

export function docToText(doc: Engine.Doc): string {
  if (hasText(doc)) return doc[Engine.Context.iris.schema.text];

  // Temporary until ambiguity is resolved around compact vs expanded JSON-LD
  // return doc[Engine.Context.iris.$.caption].map(caption => caption[Engine.Context.iris.schema.text]).join(' ');
  return doc[Engine.Context.iris.$.caption].map(caption => caption.text).join(' ');
}

export type IRResult = { concepts: Concept[], namedEntities: DBPediaResource[] };
export async function retrieveInformation(text: string): Promise<IRResult> {
  const response = await fetch(`${RETRIEVE_URL}/text?concepts&namedEntities`, {
    method: 'post',
    headers: {
      'Content-type': 'text/plain'
    },
    body: text
  });

  const result = await response.json<IRResult>();
  // console.log('Received result:', result);

  return result;
}

// export async function getNamedEntities(text: string, concepts: Array<Concept>): Promise<Array<DBPediaResource>> {
//   const response = await fetch(`${RETRIEVE_URL}/text?namedEntities`, {
//     method: 'post',
//     headers: {
//       'Content-type': 'text/plain'
//     },
//     body: text
//   });
//
//   const result = await response.json();
//   return result.namedEntities;
// }

export function conceptsToTags(concepts: Array<Concept>, taggableId: string): Array<Tag> {
  return concepts.map(concept => {
    return {
      "@type": [ Engine.Context.iris.$.Tag ],
      tagOf: taggableId,
      about: {
        "@id": concept.dbpedia_resource,
        "@type": Engine.Context.iris.$.Entity
      },
      score: concept.relevance,
    }
  }).map(partialTag => ({
    "@id": generateId(...[ partialTag.tagOf, partialTag.about["@id"] ]),
    ...partialTag
  }));
}

export function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, taggableId: string): Array<Annotation> {
  return namedEntities.map(resource => {
    return {
      "@type": [ Engine.Context.iris.$.Annotation ],
      tagOf: taggableId,
      about: {
        "@id": resource["@URI"],
        "@type": Engine.Context.iris.$.Entity
      },
      score: parseFloat(resource["@similarityScore"]),
      detectedAs: resource["@surfaceForm"],
      startPosition: parseInt(resource["@offset"])
    }
  }).map(partialAnnotation => ({
    "@id": generateId(...[ partialAnnotation.tagOf, partialAnnotation.about["@id"], partialAnnotation.startPosition, partialAnnotation.detectedAs ]),
    ...partialAnnotation
  }));
}
