import { Doc } from 'feedbackfruits-knowledge-engine';
export declare function isOperableDoc(doc: Doc): boolean;
export declare type Entity = {
    link: string;
};
export declare function textToConcepts(text: any): Promise<string[]>;
export declare function parseEntities(entities: Entity[]): string[];
export declare function deduplicate(strings: string[]): string[];
