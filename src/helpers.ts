import fetch from 'node-fetch';
// import * as FormData from 'form-data';
import * as Engine from 'feedbackfruits-knowledge-engine';
import { MEDIA_URL, RETRIEVE_URL } from './config';
import { createIndex } from './create-index';
import * as PDF from './pdf';

export function isOperableDoc(doc: Engine.Doc): doc is Engine.Doc & ({ ['https://knowledge.express/caption']: Array<Object> } | { ['http://schema.org/text']: string }) {
  return (!hasTags(doc) || !hasAnnotations(doc) ) && (hasCaptions(doc) || (isDocument(doc) && hasMedia(doc) || (isWebPageResource(doc) && hasMedia(doc))));
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

export function isWebPageResource(doc: Engine.Doc): boolean {
  return [].concat(doc["@type"]).indexOf(Engine.Context.iris.$.WebPageResource) != -1;
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
  const { concepts, namedEntities } = await retrieveInformation({ text });
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

export async function annotateWebPageResource(doc: Engine.Doc): Promise<Engine.Doc> {
  const url = doc["@id"]
  console.log('Retrieving information for url:', url);
  const { concepts, namedEntities } = await retrieveInformation({ url });
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
  console.log('Created index:', JSON.stringify(sdi));
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
  const pdfUrl = `${mediaUrl}/pdf.pdf`;
  // console.log('Getting pdf from media:', pdfUrl);
  const response = await fetch(pdfUrl);
  // console.log('Got response from media:', response);
  const pdf = await PDF.parse(response.body);
  // console.log('Parsed PDF:', pdf);
  const title = pdf.meta.title;
  const text = PDF.toText(pdf);
  // console.log(`Got text from PDF url ${pdfUrl}:`, text);
  const annotated = await annotate(text, doc);
  const annotations = annotated[Engine.Context.iris.$.annotation] || [];
  if (annotations.length === 0) return annotated;

  const mappedAnnotations = (await Promise.all(annotations.map(annotation => Engine.Doc.compact(annotation, Engine.Context.context))))
    .map((annotation: Annotation) => {
      const id = annotation["@id"];
      const words = PDF.findAnnotation(pdf, annotation);
      // console.log(`Found annotations ${annotation.detectedAs} as:`, JSON.stringify(words));
      const boundingBox = words.map(word => {
        const { "$": { xMin, yMin, xMax, yMax} } = word;
        return `${[ xMin, yMin, xMax, yMax ].join(" ")}`;
      });

      return {
        ...annotation,
        "@type": [].concat(annotation["@type"], "DocumentAnnotation"),
        [Engine.Context.iris.$.boundingBox]: boundingBox
      }
    });

  const withMappedAnnotations = {
    ...annotated,
    [Engine.Context.iris.schema.name]: title,
    [Engine.Context.iris.$.annotation]: mappedAnnotations,
  }

  return withMappedAnnotations;
}

export function generateId(...strings: Array<string | number>): string {
  return `https://knowledge.express/tag#${new Buffer(strings.join('-')).toString('base64')}`;
}

export type IRResult = { concepts: Concept[], namedEntities: DBPediaResource[] };
export async function retrieveInformation(options: { text?: string, url?: string }): Promise<IRResult> {
  let response: Response;
  if ('text' in options) {
    response = await fetch(`${RETRIEVE_URL}/text?concepts&namedEntities`, {
      method: 'post',
      headers: {
        'Content-type': 'text/plain'
      },
      body: options['text']
    });
  }

  if ('url' in options) {
    response = await fetch(`${RETRIEVE_URL}/url?concepts&namedEntities`, {
      method: 'post',
      headers: {
        'Content-type': 'text/plain'
      },
      body: options['url']
    });
  }


  const result: IRResult = await response.json();
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
