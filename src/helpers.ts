import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import { Doc, Helpers } from 'feedbackfruits-knowledge-engine';
import * as Context from 'feedbackfruits-knowledge-context';
import { EXTRACTOR_URL, MEDIA_URL } from './config';

const wikipediaRegex = /^https:\/\/en\.wikipedia\.org\/wiki\/(.*)$/
export function isOperableDoc(doc: Doc): boolean {
  return (Helpers.decodeIRI(Context.text) in doc) && !(Helpers.decodeIRI(Context.about) in doc);
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
export async function textToConcepts(text): Promise<string[]> {
  // console.log(`Sending text to ${EXTRACTOR_URL}`);
  const response = await fetch(EXTRACTOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ text })
  });

  const resText = await response.text();
  let entities: { concepts: Entity[] };

  try {
    entities = (resText == '' || !resText) ? { concepts: [] } : JSON.parse(resText);
  } catch(error) {
    console.log("TEXT:", resText);
    throw error;
  }

  console.log('DATA: ', entities);

  // console.log('Receive entities:', entities);
  return parseEntities(entities.concepts);
}

export function parseEntities(entities: Entity[]): string[] {
  return deduplicate(entities.map(entity => {
    const match = entity.link.match(wikipediaRegex);
    const id = match[1];
    return Helpers.iriify(`http://dbpedia.org/resource/${id}`);
  }));
}

export function deduplicate(strings: string[]): string[] {
  return Object.keys(strings.reduce((memo, str) => Object.assign(memo, { [str]: true }),{}));
}
