import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import { Doc, Helpers } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import { WATSON_URL, WATSON_USERNAME, WATSON_PASSWORD, ANNOTATOR_URL, MEDIA_URL } from './config';

export function isOperableDoc(doc: Doc): doc is Doc & ({ ['https://knowledge.express/caption']: Array<Object> } | { ['http://schema.org/text']: string }) {
  return (!hasTags(doc) || !hasAnnotations(doc) ) && (hasCaptions(doc) || hasText(doc));
}

export function hasCaptions(doc: Doc): doc is Doc & { ['https://knowledge.express/caption']: string } {
  return Context.graph.$.caption in doc;
}

export function hasText(doc: Doc): doc is Doc & { ['http://schema.org/text']: string } {
  return Context.graph.schema.text in doc;
}

export function hasTags(doc: Doc): doc is Doc & { ['https://knowledge.express/tag']: string } {
  return Context.graph.$.tag in doc;
}

export function hasAnnotations(doc: Doc): doc is Doc & { ['https://knowledge.express/annotation']: string } {
  return Context.graph.$.annotation in doc;
}

// export type Media = {
//   id: string,
// };
// export async function textToMedia(text: string): Promise<Media> {
//   const response = await fetch(url, {
//     method: 'post',
//   });
//   const media = await response.json();
//   return {
//     id: media.id
//   }
// };
//
// async function mediaFromURL(url) {
//   const form = new FormData();
//
//   form.append('file', text);
//
//   // console.log('Posting form to media server with url', url)
//   const response = await fetch(MEDIA_URL, {
//     method: 'post',
//     headers: form.getHeaders(),
//     body: form
//   });
//
//   const resText = await response.text();
//   console.log('Media response:', resText);
//   return JSON.parse(resText);
// }
//

export type Concept = {
  text: string;
  relevance: number;
  dbpedia_resource: string;
};

export type Tag = {
  id: string;
  resource: { id: string };
  entity: { id: string };
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

export function generateId(...strings: Array<string | number>): string {
  return new Buffer(strings.join('-')).toString('base64')
}

export function docToText(doc: Doc): string {
  if (hasText(doc)) return doc[Context.graph.schema.text];

  // Temporary until ambiguity is resolved around compact vs expanded JSON-LD
  // return doc[Context.graph.$.caption].map(caption => caption[Context.graph.schema.text]).join(' ');
  return doc[Context.graph.$.caption].map(caption => caption.text).join(' ');
}

export async function getConcepts(text: string): Promise<Array<Concept>> {
  // console.log(`Sending text to ${WATSON_URL}`);

  const auth = new Buffer(`${WATSON_USERNAME}:${WATSON_PASSWORD}`).toString('base64');
  const response = await fetch(WATSON_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      version: '2017-02-27', // This is required by the API
      text: text.replace(/[^\w]/g, ' ').trim(),
      // Enabling more features costs more money
      features: {
        concepts: {},
        // entities: {},
        // keywords: {},
        // categories: {},
        // emotion: {},
        // sentiment: {},
        // semantic_roles: {}
      }
    })
  });

  const result: { concepts: Concept[] } = await response.json();
  // console.log('Received result:', result);

  return result.concepts;
}

export async function getNamedEntities(text: string, concepts: Array<Concept>): Promise<Array<DBPediaResource>> {
  const body = `text=${encodeURIComponent(text)}&confidence=0.5&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=&sparql=${encodeURIComponent(`
  SELECT * WHERE {
    ${concepts.map(concept => `{
      SELECT * WHERE {
      values ?uri { '${concept.dbpedia_resource}' }
      }
    }`).join(' UNION ')}
  }
`)}`;

  const response = await fetch(ANNOTATOR_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/x-www-form-urlencoded',
    },
    body: body
  });

  let result;
  const resText = await response.text();
  try {
    result = JSON.parse(resText);
  } catch(e) {
    console.log(resText);
    throw new Error('Error parsing JSON response: ' + resText);
  }
  // const result = await response.json();

  // console.log('Got response:', result);

  if (!('Resources' in result)) return [];
  return result.Resources;
}

export function conceptsToTags(concepts: Array<Concept>, resourceId: string): Array<Tag> {
  return concepts.map(concept => {
    return {
      resource: { id: resourceId },
      entity: { id: concept.dbpedia_resource },
      score: concept.relevance,
    }
  }).map(partialTag => ({
    id: generateId(...[ partialTag.resource.id, partialTag.entity.id ]),
    ...partialTag
  }));
}

export function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, resourceId: string): Array<Annotation> {
  return namedEntities.map(resource => {
    return {
      resource: { id: resourceId },
      entity: { id: Helpers.encodeIRI(resource["@URI"]) },
      score: parseFloat(resource["@similarityScore"]),
      detectedAs: resource["@surfaceForm"],
      startPosition: parseInt(resource["@offset"])
    }
  }).map(partialAnnotation => ({
    id: generateId(...[ partialAnnotation.resource.id, partialAnnotation.entity.id, partialAnnotation.startPosition, partialAnnotation.detectedAs ]),
    ...partialAnnotation
  }));
}
