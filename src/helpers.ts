import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import * as Engine from 'feedbackfruits-knowledge-engine';
import { MEDIA_URL, RETRIEVE_URL } from './config';
import { createIndex } from './create-index';

export function isOperableDoc(doc: Engine.Doc): doc is Engine.Doc & ({ ['https://knowledge.express/caption']: Array<Object> } | { ['http://schema.org/text']: string }) {
  return (!hasTags(doc) || !hasAnnotations(doc) ) && (hasCaptions(doc) || (isDocument(doc) && hasMedia(doc)));
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

export function isDocument(doc: Engine.Doc): boolean {
  return [].concat(doc["@type"]).indexOf(Engine.Context.iris.$.Document) != -1;
}

export function hasMedia(doc: Engine.Doc): doc is Engine.Doc {
  return Engine.Context.iris.schema.encoding in doc && doc[Engine.Context.iris.schema.encoding].find(id => {
    return ((typeof id === 'string') ? id.indexOf(MEDIA_URL) : id["@id"].indexOf(MEDIA_URL)) === 0;
  });
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

export async function annotate(text: string, doc: Engine.Doc): Promise<Engine.Doc> {
  console.log('Retrieving information for text:', text);
  const { concepts, namedEntities } = await retrieveInformation(text);
  const tags = conceptsToTags(concepts, doc["@id"]);
  const annotations = namedEntitiesToAnnotations(namedEntities, doc["@id"]);

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

export async function annotateVideo(doc: Engine.Doc): Promise<Engine.Doc> {
  const [ caption ] = doc[Engine.Context.iris.$.caption];
  const [ url ] = caption["@id"].split('#');
  const captions = await Engine.Captions.getCaptions(url);
  const text = await Engine.Captions.toText(captions);

  const annotated = await annotate(text, doc);

  const annotations = annotated[Engine.Context.iris.$.annotation] || [];
  if (annotations.length === 0) return annotated;

  const sdi = createIndex(annotated, captions);
  const mappedAnnotations = annotations.map(annotation => {
    const id = annotation["@id"];
    const startDuration = sdi[id];
    return {
      ...annotation,
      "@type": [].concat(annotation["@type"], "VideoAnnotation"),
      [Engine.Context.iris.$.startDuration]: startDuration
    }
  });

  const withMappedAnnotations = {
    ...annotated,
    [Engine.Context.iris.$.annotation]: mappedAnnotations,
  }

  return withMappedAnnotations;
}

export async function annotateDocument(doc: Engine.Doc): Promise<Engine.Doc> {
  const mediaUrlOrDoc = doc[Engine.Context.iris.schema.encoding].find(id => ((typeof id === 'string') ? id.indexOf(MEDIA_URL) : id["@id"].indexOf(MEDIA_URL)) === 0);
  const mediaUrl = typeof mediaUrlOrDoc === 'string' ? mediaUrlOrDoc : mediaUrlOrDoc["@id"];
  const textUrl = `${mediaUrl}/text.txt`;
  console.log('Getting text from media:', textUrl);
  const response = await fetch(textUrl);
  const text = await response.text();
  return annotate(text, doc);
}

export function generateId(...strings: Array<string | number>): string {
  return `https://knowledge.express/tag#${new Buffer(strings.join('-')).toString('base64')}`;
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
  console.log('Received ir:', JSON.stringify(result));

  return result;
}

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
