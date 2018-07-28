import fetch from 'node-fetch';
import { spawn } from 'child_process';
import * as xml2js from 'xml2js';
import { Annotation } from './helpers';

// export type PDF = {
//   meta: any
//   pages: Page[]
// }
//
// export type Page = {
//   pageInfo: any
//   content: PageContent[]
// }
//
// export type PageContent = {
//   x: number,
//   y: number,
//   str: string,
//   dir: "ltr" | "rtl",
//   width: number,
//   height: number,
//   fontName: string
// };

export async function load(pdfUrl: string) {
  const response = await fetch(pdfUrl);
  return parse(response.body);
}

export async function parse(pdfStream: NodeJS.ReadableStream) {
  const xmlString = await new Promise((resolve, reject) => {
    const command = 'pdftotext';
    const args = [
      "-bbox",
      "-",
      "-"
    ];

    const options = {

    };

    let output = '';
    let stderr = '';
    const child = spawn(command, args, options);
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

  const json = await new Promise<any>((resolve, reject) => {
    xml2js.parseString(xmlString, { trim: false }, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });

  // const pages = json.html.body[0].doc[0].page;
  //
  // const text = pages
  //   // .map(page => page.page)
  //   .reduce((memo, page) => {
  //   console.log(`Reducing page: ${JSON.stringify(page)}`);
  //   return page.word.reduce((memo, word) => {
  //     console.log(`Reducing word: ${JSON.stringify(word)}`)
  //     const str = word["_"];
  //     return [ ...memo, str ];
  //   }, memo);
  // }, []).join(' ');
  //
  // return text;
  return json;
  // return JSON.stringify(json);
}

export function toText(pdf: any) {
  const pages = pdf.html.body[0].doc[0].page;

  const text = pages
    .reduce((memo, page) => {
      // console.log(`Reducing page: ${JSON.stringify(page)}`);
      return page.word.reduce((memo, word) => {
        // console.log(`Reducing word: ${JSON.stringify(word)}`)
        const str = word["_"];

        // Skip unicode SUB char
        if (str === "\u001a") return memo;

        return [ ...memo, str ];
      }, memo);
  }, []).join(' ');

  return text;
}

export function findAnnotation(pdf: any, annotation: Annotation) {
  // console.log(`Looking for annotation in pdf:`, JSON.stringify(annotation));
  const pages = pdf.html.body[0].doc[0].page;

  const rangeStart = annotation.startPosition;
  const rangeEnd = rangeStart + annotation.detectedAs.length;

  let index = 0;
  const words = pages
    .reduce((memo, page, pageIndex) => {
      const words = page.word;
      return words.reduce((memo, word, wordIndex) => {
        const str = word["_"];

        // Skip unicode SUB char
        if (str === "\u001a") return memo;

        // Bump indices
        const startIndex = index;
        const endIndex = startIndex + str.length;

        // if (wordIndex === words.length - 1) console.log(`End of page.${pageIndex + 1}`);

        index = endIndex + 1;

        if (startIndex > rangeEnd + 50) return memo;
        if (endIndex < rangeStart - 50) return memo;
        // console.log(`Looking for ${annotation.detectedAs} at ${rangeStart} to ${rangeEnd} between ${startIndex} and ${endIndex}: `, str);

        const found =
          // Either our range starts within this part of the text
          (startIndex <= rangeStart && rangeStart <= endIndex) ||
          // Or it ends within this part of the text
          (startIndex <= rangeEnd && rangeEnd <= endIndex);

        if (found) return [ ...memo, word ];
        return memo;
      }, memo);
  }, []);

  if (words.length === 0) {
    throw new Error(`Unable to find ${annotation.detectedAs} at ${rangeStart} to ${rangeEnd} in PDF.`);
  }

  return words;
}
