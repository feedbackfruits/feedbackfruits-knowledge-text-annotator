import fetch from 'node-fetch';
import { spawn } from 'child_process';
import * as xml2js from 'xml2js';
import { Annotation } from './helpers';

export type PDF = {
  page: Page[]
}

export type Page = {
  $: {
    width: string,
    height: string
  }
  word: Word[]
}

export type Word = {
  _: string,
  $: {
    xMin: string
    xMax: string
    yMin: string
    yMax: string
  }
}

export async function load(pdfUrl: string): Promise<PDF> {
  const response = await fetch(pdfUrl);
  return parse(response.body);
}

export async function parse(pdfStream: NodeJS.ReadableStream): Promise<PDF> {
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
  return json.html.body[0].doc[0] as PDF;
  // return JSON.stringify(json);
}

export function toText(pdf: PDF): string {
  const pages = pdf.page;

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

export function findAnnotation(pdf: PDF, annotation: Annotation): Word[] {
  // console.log(`Looking for annotation in pdf:`, JSON.stringify(annotation));
  const pages = pdf.page;

  const rangeStart = annotation.startPosition;
  const rangeEnd = rangeStart + annotation.detectedAs.length;

  let index = 0;
  const words = pages
    .reduce((memo, page, pageIndex) => {
      const { width, height } = page.$;
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

        if (found) return [ ...memo, makeWordBoudingBoxRelative(word, parseFloat(width), parseFloat(height), pageIndex + 1) ];
        return memo;
      }, memo);
  }, []);

  if (words.length === 0) {
    throw new Error(`Unable to find ${annotation.detectedAs} at ${rangeStart} to ${rangeEnd} in PDF.`);
  }

  return words;
}

export function makeWordBoudingBoxRelative(word: Word, width: number, height: number, pageNum: number): Word {
  const [ xMin, yMin, xMax, yMax ] = Object.values(word.$).map(str => parseFloat(str));
  // const [ xMin, yMin, xMax, yMax ] = boudingBox.split(" ").map(str => parseFloat(str));

  const relativeBoundingBox = {
    xMin: `${pageNum + (xMin / width)}`,
    yMin: `${pageNum + (yMin / height)}`,
    xMax: `${pageNum + (xMax / width)}`,
    yMax: `${pageNum + (yMax / height)}`
  };

  return {
    ...word,
    $: {
      ...word.$,
      ...relativeBoundingBox
    }
  };
  // return relativeBoundingBox.join(" ");
}