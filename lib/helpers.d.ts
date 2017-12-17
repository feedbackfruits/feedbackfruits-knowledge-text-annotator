import { Doc } from 'feedbackfruits-knowledge-engine';
export declare function isOperableDoc(doc: Doc): boolean;
export declare type Entity = {
    link: string;
};
export declare type Tag = {
    document: {
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
export declare function annotateText(text: string, concepts: {
    id: string;
}[]): Promise<Array<Partial<Annotation>>>;
export declare function textToConcepts(text: string): Promise<Array<{
    id: string;
}>>;
export declare function parseEntities(entities: Entity[]): Array<{
    id: string;
}>;
export declare function deduplicate(strings: string[]): string[];
