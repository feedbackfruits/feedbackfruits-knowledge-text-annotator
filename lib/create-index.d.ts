import { Doc, Captions } from 'feedbackfruits-knowledge-engine';
export declare function createIndex(doc: Doc, captions: Captions.Caption[]): {
    [index: string]: string;
};
export declare function withIndex(captions: Captions.Caption[]): (Captions.Caption & {
    startIndex: number;
    endIndex: number;
})[];
