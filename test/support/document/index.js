import * as fs from 'fs';

import doc from './doc';
import concepts from './concepts';
import namedEntities from './named-entities';
import tags from './tags';
import annotations from './annotations';

const pdf = fs.createReadStream(__dirname + '/pdf2.pdf');
import parsedPDF from './pdf';
const pdfText = fs.readFileSync(__dirname + '/pdf.txt').toString();

export {
  doc,
  concepts,
  namedEntities,
  tags,
  annotations,

  pdf,
  parsedPDF,
  pdfText
}
