import fetch from 'node-fetch';
import * as xml2json from 'xml2json';
import parseSRT = require('parse-srt');

const googleRegex = /https:\/\/video\.google\.com\/timedtext\?v=(.*)&lang=en#(.*)/

export function unescapeHtml(safe) {
  return safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function trimNewlines(str: string) {
  return str.replace('\n', ' ').trim();
}

export async function captionsToText(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (googleRegex.test(url)) {
    // SRT captions
    let parsed;
    try {
      parsed = parseSRT(text);
    } catch(e) {
      console.log('Failed SRT parsing:', url);
      throw e;
    }

    return parsed.map(sub => {
      const { text } = sub;
      const parsedText = text.replace(/<br \/>/, ' ');
      // console.log('Sub:', id, start, end, text);
      return parsedText;
    }).join(' ');

  } else {
    // XML captions
      const json = <any>xml2json.toJson(text, { object: true, trim: false });
      const captions = json.transcript.text;
      return captions.map((caption, index) => {
        const text = '$t' in caption ? trimNewlines(unescapeHtml(caption['$t'])) : '';
        return text;
      }).join(' ');

  }
}

export default captionsToText;
