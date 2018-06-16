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
const xml2json = require("xml2json");
const parseSRT = require("parse-srt");
const googleRegex = /https:\/\/video\.google\.com\/timedtext/;
function unescapeHtml(safe) {
    return safe
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
exports.unescapeHtml = unescapeHtml;
function trimNewlines(str) {
    return str.replace('\n', ' ').trim();
}
exports.trimNewlines = trimNewlines;
function captionsToText(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield node_fetch_1.default(url);
        const text = yield response.text();
        if (googleRegex.test(url)) {
            const json = xml2json.toJson(text, { object: true, trim: false });
            const captions = json.transcript.text;
            return captions.map((caption, index) => {
                const text = '$t' in caption ? trimNewlines(unescapeHtml(caption['$t'])) : '';
                return text;
            }).join(' ');
        }
        else {
            let parsed;
            try {
                parsed = parseSRT(text);
            }
            catch (e) {
                console.log('Failed SRT parsing:', url);
                throw e;
            }
            return parsed.map(sub => {
                const { text } = sub;
                const parsedText = text.replace(/<br \/>/, ' ');
                return parsedText;
            }).join(' ');
        }
    });
}
exports.captionsToText = captionsToText;
exports.default = captionsToText;
