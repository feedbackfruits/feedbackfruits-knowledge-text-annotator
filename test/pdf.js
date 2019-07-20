import test from 'ava';
import * as PDF from '../lib/pdf';
import * as Support from './support';
import * as fs from 'fs';

// test('parse: it parses PDFs', async t => {
//   const result = await PDF.parse(Support.Document.pdf);
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.Document.parsedPDF);
// });

test('toText: it converts a PDF to text', async t => {
  const pdf = await PDF.parse(Support.Document.pdf);
  const result = await PDF.toText(pdf);
  // fs.writeFileSync('out.txt', new Buffer(result));
  // console.log("Index of SUB char:", result.indexOf("\u001a"))
  // console.log(JSON.stringify(result));
  return t.deepEqual(result, Support.Document.pdfText);
});

// test('toText: it converts a big PDF to text', async t => {
//   const pdfBuffer = await Support.BigPDF.getPDF();
//   const pdf = await PDF.parse(pdfBuffer);
//   const result = await PDF.toText(pdf);
//   // fs.writeFileSync('out.txt', new Buffer(result));
//   // console.log("Index of SUB char:", result.indexOf("\u001a"))
//   // console.log(JSON.stringify(result));
//   return t.deepEqual(result, Support.BigPDF.pdfText);
// });

test('findAnnotation: it finds annotations', async t => {
  const pdf = await PDF.parse(Support.Document.pdf);
  return Support.Document.annotations.map((annotation, i) => {
    const result = PDF.findAnnotation(pdf, annotation);
    const index = result.map(word => word["_"]).join(" ").indexOf(annotation.detectedAs);
    if (index === -1) console.log(`Matched ${i + 1}-th ${annotation.detectedAs} to:`, JSON.stringify(result));
    return t.not(index, -1);
  })
});

test('findAnnotation: it finds more annotations', async t => {
  const pdf = await PDF.parse(Support.Document2.pdf);
  return Support.Document2.annotations.map((annotation, i) => {
    const result = PDF.findAnnotation(pdf, annotation);
    const index = result.map(word => word["_"]).join(" ").indexOf(annotation.detectedAs);
    // if (index === -1) console.log(`Matched ${i + 1}-th ${annotation.detectedAs} to:`, JSON.stringify(result));
    return t.not(index, -1);
  })
});

// test('findAnnotation: it finds annotations in a big PDF', async t => {
//   const pdf = await PDF.parse(Support.BigPDF.pdf);
//   // fs.writeFileSync('out.json', new Buffer(JSON.stringify(pdf)));
//   // console.log(pdf);
//   return Support.BigPDF.annotations.map((annotation, i) => {
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
