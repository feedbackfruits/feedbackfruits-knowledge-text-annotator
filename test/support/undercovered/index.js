import * as fs from 'fs';

// import doc from './doc';
import concepts from './concepts';
import namedEntities from './named-entities';
// import tags from './tags';
// import annotations from './annotations';

const pdf = fs.createReadStream(__dirname + '/undercovered.pdf');
import parsedPDF from './pdf';
const pdfText = fs.readFileSync(__dirname + '/undercovered.txt').toString();

export {
  // doc,
  concepts,
  namedEntities,
  // tags,
  // annotations,

  pdf,
  parsedPDF,
  pdfText
}
