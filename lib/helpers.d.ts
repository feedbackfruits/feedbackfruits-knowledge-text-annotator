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
export declare type Concept = {
    text: string;
    relevance: number;
    dbpedia_resource: string;
};
export declare type Tag = {
    id: string;
    resource: {
        id: string;
    };
    entity: {
        id: string;
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
export declare function generateId(...strings: Array<string | number>): string;
export declare function docToText(doc: Doc): string;
export declare function getConcepts(text: string): Promise<Array<Concept>>;
export declare function getNamedEntities(text: string, concepts: Array<Concept>): Promise<Array<DBPediaResource>>;
export declare function conceptsToTags(concepts: Array<Concept>, resourceId: string): Array<Tag>;
export declare function namedEntitiesToAnnotations(namedEntities: Array<DBPediaResource>, resourceId: string): Array<Annotation>;
