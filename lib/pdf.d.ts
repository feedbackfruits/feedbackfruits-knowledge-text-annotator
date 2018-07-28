/// <reference types="node" />
import { Annotation } from './helpers';
export declare function load(pdfUrl: string): Promise<any>;
export declare function parse(pdfStream: NodeJS.ReadableStream): Promise<any>;
export declare function toText(pdf: any): any;
export declare function findAnnotation(pdf: any, annotation: Annotation): any;
