/// <reference types="node" />
import { Annotation } from './helpers';
export declare type PDF = {
    meta: Meta;
    page: Page[];
};
export declare type Meta = {
    title: string;
};
export declare type Page = {
    $: {
        width: string;
        height: string;
    };
    word: Word[];
};
export declare type Word = {
    _: string;
    $: {
        xMin: string;
        xMax: string;
        yMin: string;
        yMax: string;
    };
};
export declare function load(pdfUrl: string): Promise<PDF>;
export declare function parse(pdfStream: NodeJS.ReadableStream): Promise<PDF>;
export declare function toText(pdf: PDF): string;
export declare function findAnnotation(pdf: PDF, annotation: Annotation): Word[];
export declare function makeWordBoudingBoxRelative(word: Word, width: number, height: number, pageNum: number): Word;
