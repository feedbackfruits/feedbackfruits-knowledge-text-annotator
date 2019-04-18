import * as fs from 'fs';
import test from 'ava';
import * as PDF from '../lib/pdf';
import * as Support from './support';

// test('parse: it parses PDFs', async t => {
//   const result = await PDF.parse(Support.Undercovered.pdf);
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.Undercovered.parsedPDF);
// });

// test('toText: it convert a PDF to text', async t => {
//   const pdf = await PDF.parse(Support.Undercovered.pdf);
//   // fs.writeFileSync('bla.json', JSON.stringify(pdf));
//   const result = await PDF.toText(pdf);
//   // fs.writeFileSync('bla.text', result);
//   // console.log(result);
//   // console.log("Index of SUB char:", result.indexOf("\u001a"))
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.Undercovered.pdfText);
// });

test('findAnnotation: it finds annotations', async t => {
  const pdf = await PDF.parse(Support.Undercovered.pdf);
  // fs.writeFileSync('bla.json', JSON.stringify(pdf));
  // console.log(pdf);
  // return Support.Undercovered.annotations.map((annotation, i) => {
  //   const result = PDF.findAnnotation(pdf, annotation);
  //   const index = result.map(word => word["_"]).join(" ").indexOf(annotation.detectedAs);
  //   if (index === -1) console.log(`Matched ${i + 1}-th ${annotation.detectedAs} to:`, JSON.stringify(result));
  //   return t.not(index, -1);
  // })
});
//
// test('findAnnotation: it finds more annotations', async t => {
//   const pdf = await PDF.parse(Support.Undercovered.pdf);
//   return Support.Undercovered.annotations.map((annotation, i) => {
//     const result = PDF.findAnnotation(pdf, annotation);
//     const index = result.map(word => word["_"]).join(" ").indexOf(annotation.detectedAs);
//     // if (index === -1) console.log(`Matched ${i + 1}-th ${annotation.detectedAs} to:`, JSON.stringify(result));
//     return t.not(index, -1);
//   })
// });

// test('findAnnotation: it finds more annotations', async t => {
//   const pdfURL = "https://ocw.mit.edu/courses/architecture/4-241j-theory-of-city-form-spring-2013/lecture-notes/MIT4_241JS13_handout2.pdf";
//   const pdf = await PDF.load(pdfURL);
//   const startPosition = 1305;
//   const detectedAs = 'MIT OpenCourseWare';
//   const result = PDF.findAnnotation(pdf, { startPosition, detectedAs });
//   return t.deepEqual(result.map(word => word["_"]).join(" "), detectedAs);
// });
