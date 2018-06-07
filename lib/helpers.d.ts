import * as Engine from 'feedbackfruits-knowledge-engine';
export declare function isOperableDoc(doc: Engine.Doc): doc is Engine.Doc & ({
    ['https://knowledge.express/caption']: Array<Object>;
} | {
    ['http://schema.org/text']: string;
});
export declare function hasCaptions(doc: Engine.Doc): doc is Engine.Doc & {
    ['https://knowledge.express/caption']: string;
};
export declare function hasText(doc: Engine.Doc): doc is Engine.Doc & {
    ['http://schema.org/text']: string;
};
export declare function hasTags(doc: Engine.Doc): doc is Engine.Doc & {
    ['https://knowledge.express/tag']: string;
};
export declare function hasAnnotations(doc: Engine.Doc): doc is Engine.Doc & {
    ['https://knowledge.express/annotation']: string;
};
export declare function isDocument(doc: Engine.Doc): boolean;
export declare function hasMedia(doc: Engine.Doc): doc is Engine.Doc;
export declare type Caption = {
    "@id": string;
    "@type": string[];
    text: string;
};
export declare type Concept = {
    text: string;
    relevance: number;
    dbpedia_resource: string;
};
export declare type Tag = {
    "@id": string;
    "@type": string[];
    tagOf: string;
    about: {
        "@id": string;
        "@type": string;
    };
    score: number;
};
export declare type Annotation = Tag & {
    confidence?: number;
    detectedAs: string;
    startPosition: number;
};
export declare type Partial<T> = {
    [P in keyof T]?: T[P];
};
export declare type DBPediaResource = {
    "@URI": string;
    "@support": string;
    "@types": string;
    "@surfaceForm": string;
    "@offset": string;
    "@similarityScore": string;
    "@percentageOfSecondRank": string;
};
export declare function annotate(text: string, doc: Engine.Doc): Promise<Engine.Doc>;
export declare function annotateVideo(doc: Engine.Doc): Promise<Engine.Doc>;
export declare function annotateDocument(doc: Engine.Doc): Promise<Engine.Doc>;
export declare function generateId(...strings: Array<string | number>): string;
export declare function mapCaptions(captions: Caption[], namedEntities: DBPediaResource[]): Caption[];
export declare function docToText(doc: Engine.Doc): string;
export declare type IRResult = {
    concepts: Concept[];
    namedEntities: DBPediaResource[];
};
export declare function retrieveInformation(text: string): Promise<IRResult>;
export declare function conceptsToTags(concepts: Array<Concept>, taggableId: string): Array<Tag>;
export declare function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, taggableId: string): Array<Annotation>;
