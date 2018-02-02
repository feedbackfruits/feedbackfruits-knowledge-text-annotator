import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import { Doc } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import { RETRIEVE_URL } from './config';

export function isOperableDoc(doc: Doc): doc is Doc & ({ ['https://knowledge.express/caption']: Array<Object> } | { ['http://schema.org/text']: string }) {
  return (!hasTags(doc) || !hasAnnotations(doc) ) && (hasCaptions(doc) || hasText(doc));
}

export function hasCaptions(doc: Doc): doc is Doc & { ['https://knowledge.express/caption']: string } {
  return Context.iris.$.caption in doc;
}

export function hasText(doc: Doc): doc is Doc & { ['http://schema.org/text']: string } {
  return Context.iris.schema.text in doc;
}

export function hasTags(doc: Doc): doc is Doc & { ['https://knowledge.express/tag']: string } {
  return Context.iris.$.tag in doc;
}

export function hasAnnotations(doc: Doc): doc is Doc & { ['https://knowledge.express/annotation']: string } {
  return Context.iris.$.annotation in doc;
}

export type Caption = {
  "@id": string,
  text: string
};

export type Concept = {
  text: string;
  relevance: number;
  dbpedia_resource: string;
};

export type Tag = {
  "@id": string;
  tagOf: string[];
  about: string;
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

export async function annotateVideo(doc: Doc): Promise<Doc> {
  const text = await docToText(doc);
  const { concepts, namedEntities } = await retrieveInformation(text);
  const tags = conceptsToTags(concepts, doc["@id"]);
  const mappedCaptions = mapCaptions(doc[Context.iris.$.caption], namedEntities);

  return {
    ...doc,
    [Context.iris.$.tag]: tags,
    [Context.iris.$.caption]: mappedCaptions
  };
}

export function generateId(...strings: Array<string | number>): string {
  return new Buffer(strings.join('-')).toString('base64')
}

// Returns all the captions that overlap with the range
export function captionsForRange(captions, startIndex, endIndex) {
  return captions.reduce((memo, caption) => {
    if (caption.startIndex >= startIndex && startIndex <= caption.endIndex) {
      memo.push(caption);
    }

    if (caption.startIndex >= endIndex && endIndex <= caption.endIndex) {
      memo.push(caption);
    }

    return memo;
  }, []);
}

export function mapCaptions(captions: Caption[], namedEntities: DBPediaResource[]): Caption[] {
  const withIndices = captions.reduce((memo, caption) => {
    const { baseIndex } = memo;
    const { text } = caption;
    const startIndex = baseIndex;
    const endIndex = baseIndex + text.length;

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

    if (entities.length === 0) return caption;
    const annotations = namedEntitiesToAnnotations(entities, caption["@id"]);
    return {
      ...caption,
      [Context.iris.$.annotation]: annotations
    };
  });
}

export function docToText(doc: Doc): string {
  if (hasText(doc)) return doc[Context.iris.schema.text];

  // Temporary until ambiguity is resolved around compact vs expanded JSON-LD
  // return doc[Context.iris.$.caption].map(caption => caption[Context.iris.schema.text]).join(' ');
  return doc[Context.iris.$.caption].map(caption => caption.text).join(' ');
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
      tagOf: [ taggableId ],
      about: concept.dbpedia_resource,
      score: concept.relevance,
    }
  }).map(partialTag => ({
    "@id": generateId(...[ partialTag.tagOf[0], partialTag.about ]),
    ...partialTag
  }));
}

export function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, taggableId: string): Array<Annotation> {
  return namedEntities.map(resource => {
    return {
      tagOf: [ taggableId ],
      about: resource["@URI"],
      score: parseFloat(resource["@similarityScore"]),
      detectedAs: resource["@surfaceForm"],
      startPosition: parseInt(resource["@offset"])
    }
  }).map(partialAnnotation => ({
    "@id": generateId(...[ partialAnnotation.tagOf[0], partialAnnotation.about, partialAnnotation.startPosition, partialAnnotation.detectedAs ]),
    ...partialAnnotation
  }));
}
