"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const child_process_1 = require("child_process");
const xml2js = require("xml2js");
function load(pdfUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(pdfUrl);
        return parse(response.body);
    });
}
exports.load = load;
function parse(pdfStream) {
    return __awaiter(this, void 0, void 0, function* () {
        const xmlString = yield new Promise((resolve, reject) => {
            const command = 'pdftotext';
            const args = [
                "-bbox",
                "-",
                "-"
            ];
            const options = {};
            let output = '';
            let stderr = '';
            const child = child_process_1.spawn(command, args, options);
            child.stdout.setEncoding('utf8');
            child.stderr.setEncoding('utf8');
            child.stdout.on('data', stdoutHandler);
            child.stderr.on('data', stderrHandler);
            child.on('close', closeHandler);
            pdfStream.pipe(child.stdin);
            function stdoutHandler(data) {
                output += data;
            }
            function stderrHandler(data) {
                stderr += data;
            }
            function closeHandler(code) {
                if (code !== 0) {
                    return reject(new Error('pdf-text-extract command failed: ' + stderr));
                }
                return resolve(output);
            }
        });
        const json = yield new Promise((resolve, reject) => {
            xml2js.parseString(xmlString, { trim: false }, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
        return json;
    });
}
exports.parse = parse;
function toText(pdf) {
    const pages = pdf.html.body[0].doc[0].page;
    const text = pages
        .reduce((memo, page) => {
        return page.word.reduce((memo, word) => {
            const str = word["_"];
            if (str === "\u001a")
                return memo;
            return [...memo, str];
        }, memo);
    }, []).join(' ');
    return text;
}
exports.toText = toText;
function findAnnotation(pdf, annotation) {
    const pages = pdf.html.body[0].doc[0].page;
    const rangeStart = annotation.startPosition;
    const rangeEnd = rangeStart + annotation.detectedAs.length;
    let index = 0;
    const words = pages
        .reduce((memo, page, pageIndex) => {
        const words = page.word;
        return words.reduce((memo, word, wordIndex) => {
            const str = word["_"];
            if (str === "\u001a")
                return memo;
            const startIndex = index;
            const endIndex = startIndex + str.length;
            index = endIndex + 1;
            if (startIndex > rangeEnd + 50)
                return memo;
            if (endIndex < rangeStart - 50)
                return memo;
            const found = (startIndex <= rangeStart && rangeStart <= endIndex) ||
                (startIndex <= rangeEnd && rangeEnd <= endIndex);
            if (found)
                return [...memo, word];
            return memo;
        }, memo);
    }, []);
    if (words.length === 0) {
        throw new Error(`Unable to find ${annotation.detectedAs} at ${rangeStart} to ${rangeEnd} in PDF.`);
    }
    return words;
}
exports.findAnnotation = findAnnotation;