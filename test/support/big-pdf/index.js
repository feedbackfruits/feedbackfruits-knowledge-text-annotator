import test from 'ava';
import * as fs from 'fs';
import fetch from 'node-fetch';
// import doc from './doc';
// import concepts from './concepts';
// import namedEntities from './named-entities';
// import tags from './tags';
import annotations from './annotations';

test.skip('Support noop document big pdf', () => {
  t.pass();
})

// export async function getPDF() {
//   if (fs.existsSync(__dirname + '/big-pdf.pdf')) {
//     const pdf = fs.createReadStream(__dirname + '/big-pdf.pdf');
//     return pdf;
//   } else {
//     const url = "https://repository.tudelft.nl/islandora/object/uuid:0197b147-8b5a-476d-a79e-721759b43ab0/datastream/OBJ/download";
//     const response = await fetch(url);
//     const text = await response.text();
//     fs.writeFileSync(__dirname + '/big-pdf.pdf', new Buffer(text));
//     return getPDF();
//   }
// }

import parsedPDF from './pdf';
const pdfText = fs.readFileSync(__dirname + '/big-pdf.txt').toString();

export {
  // doc,
  // concepts,
  // namedEntities,
  // tags,
  annotations,

  // pdf,
  parsedPDF,
  pdfText
}
