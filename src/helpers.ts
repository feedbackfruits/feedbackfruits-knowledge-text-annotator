import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import { Doc, Helpers } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import { EXTRACTOR_URL, ANNOTATOR_URL, MEDIA_URL } from './config';

const wikipediaRegex = /^https:\/\/en\.wikipedia\.org\/wiki\/(.*)$/
export function isOperableDoc(doc: Doc): boolean {
  return ('http://schema.org/text' in doc) && !('https://schema.org/about' in doc);
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

export type Entity = {
  link: string;
};

export type Tag = {
  document: { id: string };
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

export async function annotateText(text: string, concepts: { id: string }[]): Promise<Array<Partial<Annotation>>> {
  const body = `text=${encodeURIComponent(text)}&confidence=0.5&support=0&spotter=Default&disambiguator=Default&policy=whitelist&types=&sparql=${encodeURIComponent(`
  SELECT * WHERE {
    ${concepts.map(concept => `{
      SELECT * WHERE {
      values ?uri { ${concept.id} }
      }
    }`).join(' UNION ')}
  }
`)}`;

  // console.log('Body:', body);

  const response = await fetch(ANNOTATOR_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/x-www-form-urlencoded',
    },
    body: body
  });

  const result = await response.json();

  // console.log('Got response:', result);

  if (!('Resources' in result)) return [];
  const annotations = (<any[]>result.Resources).map((resource: DBPediaResource) => {
    return {
      entity: { id: Helpers.encodeIRI(resource["@URI"]) },
      score: parseFloat(resource["@similarityScore"]),
      detectedAs: resource["@surfaceForm"],
      startPosition: parseInt(resource["@offset"])
    }
  });

  return annotations;
}

export async function textToConcepts(text: string): Promise<Array<{ id: string }>> {
  // console.log(`Sending text to ${EXTRACTOR_URL}`);
  const response = await fetch(EXTRACTOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ text: text.replace(/[^\w]/g, ' ').trim() })
  });

  const resText = await response.text();
  let entities: { concepts: Entity[] };

  try {
    entities = (resText == '' || !resText) ? { concepts: [] } : JSON.parse(resText);
  } catch(error) {
    console.log("ERROR! TEXT:", resText);
    throw error;
  }

  // console.log('DATA: ', entities);

  // console.log('Receive entities:', entities);
  return parseEntities(entities.concepts);
}

export function parseEntities(entities: Entity[]): Array<{ id: string }> {
  return deduplicate(entities.map(entity => {
    const match = entity.link.match(wikipediaRegex);
    const id = match[1];
    return Helpers.iriify(`http://dbpedia.org/resource/${id}`);
  })).map(id => ({ id }));
}

export function deduplicate(strings: string[]): string[] {
  return Object.keys(strings.reduce((memo, str) => Object.assign(memo, { [str]: true }),{}));
}
