import { Doc } from 'feedbackfruits-knowledge-engine';
export declare function isOperableDoc(doc: Doc): doc is Doc & ({
    ['https://knowledge.express/caption']: Array<Object>;
} | {
    ['http://schema.org/text']: string;
});
export declare function hasCaptions(doc: Doc): doc is Doc & {
    ['https://knowledge.express/caption']: string;
};
export declare function hasText(doc: Doc): doc is Doc & {
    ['http://schema.org/text']: string;
};
export declare function hasTags(doc: Doc): doc is Doc & {
    ['https://knowledge.express/tag']: string;
};
export declare function hasAnnotations(doc: Doc): doc is Doc & {
    ['https://knowledge.express/annotation']: string;
};
export declare type Caption = {
    "@id": string;
    text: string;
};
export declare type Concept = {
    text: string;
    relevance: number;
    dbpedia_resource: string;
};
export declare type Tag = {
    "@id": string;
    tagOf: string[];
    about: string;
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
export declare function annotateVideo(doc: Doc): Promise<Doc>;
export declare function generateId(...strings: Array<string | number>): string;
export declare function captionsForRange(captions: any, startIndex: any, endIndex: any): any;
export declare function mapCaptions(captions: Caption[], namedEntities: DBPediaResource[]): Caption[];
export declare function docToText(doc: Doc): string;
export declare type IRResult = {
    concepts: Concept[];
    namedEntities: DBPediaResource[];
};
export declare function retrieveInformation(text: string): Promise<IRResult>;
export declare function conceptsToTags(concepts: Array<Concept>, taggableId: string): Array<Tag>;
export declare function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, taggableId: string): Array<Annotation>;
