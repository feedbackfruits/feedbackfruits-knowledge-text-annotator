import test from 'ava';

import memux from 'memux';
import nock from 'nock';
import init from '../lib';
import { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, PAGE_SIZE, START_PAGE, RETRIEVE_URL, MEDIA_URL } from '../lib/config';

import * as Support from './support';

// For the video
nock(RETRIEVE_URL)
  .post('/text?concepts&namedEntities')
  .reply(200, {
    concepts: Support.concepts,
    namedEntities: Support.namedEntities
  })

// For the documents
// nock(RETRIEVE_URL)
//   .post('/text?concepts&namedEntities')
//   .reply(200, {
//     concepts: Support.Document.concepts,
//     namedEntities: Support.Document.namedEntities
//   })

nock(RETRIEVE_URL)
  .post('/text?concepts&namedEntities')
  .reply(200, {
    concepts: Support.Document2.concepts,
    namedEntities: Support.Document2.namedEntities
  })

nock(MEDIA_URL)
  .get('/5b22b2d17a98990025fbdea0/pdf.pdf')
  .reply(200, Support.Document.pdf)

nock(MEDIA_URL)
  .get('/5b5c91b3d438f9003304d811/pdf.pdf')
  .reply(200, Support.Document2.pdf)


test('it exists', t => {
  t.not(init, undefined);
});

test('it works with videos and documents', async (t) => {
  try {
    let _resolve, _reject;
    const resultPromise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    let _resolve2, _reject2;
    const resultPromise2 = new Promise((resolve, reject) => {
      _resolve2 = resolve;
      _reject2 = reject;
    });

    let _resolve3, _reject3;
    const resultPromise3 = new Promise((resolve, reject) => {
      _resolve3 = resolve;
      _reject3 = reject;
    });

    let _resolve4, _reject4;
    const resultPromise4 = new Promise((resolve, reject) => {
      _resolve4 = resolve;
      _reject4 = reject;
    });

    const videoAnnotations = [];
    const documentAnnotations = [];
    const receive = (message) => {
      console.log('Received message!', message);
      if ([].concat(message.data["@type"]).find(type => type === "VideoObject")) _resolve(message);
      if ([].concat(message.data["@type"]).find(type => type === "Document")) _resolve2(message);
      if ([].concat(message.data["@type"]).find(type => type === "VideoAnnotation")) videoAnnotations.push(message.data);
      if ([].concat(message.data["@type"]).find(type => type === "DocumentAnnotation")) documentAnnotations.push(message.data);
    };

    const send = await memux({
      name: 'dummy-broker',
      url: KAFKA_ADDRESS,
      input: OUTPUT_TOPIC,
      output: INPUT_TOPIC,
      receive,
      options: {
        concurrency: 1
      }
    });

    await init({
      name: NAME,
    });

    await send({ action: 'write', key: Support.video['@id'], data: Support.video });

    const result = await resultPromise;
    console.log('Result data:', result.data);

    t.deepEqual({
      ...result,
      data: {
        ...result.data,
        caption: Support.sortArray(result.data.caption),
        tag: Support.sortArray(result.data.tag),
        annotation: Support.sortArray(result.data.annotation),
      }
    }, {
      action: 'write',
      data: {
        ...Support.video,
        tag: Support.sortArray(Support.tags.map(x => x["@id"])), //.map(c => c["@id"])),
        annotation: Support.sortArray(Support.annotations.map(x => x["@id"])),
      },
      key: Support.video['@id'],
      label: NAME,
    });

    await send({ action: 'write', key: Support.Document2.doc['@id'], data: Support.Document2.doc });

    const result2 = await resultPromise2;
    console.log('Result2 data:', result2.data);
    t.deepEqual({
      ...result2,
      data: {
        ...result2.data,
        tag: Support.sortArray(result2.data.tag),
        annotation: Support.sortArray(result2.data.annotation),
      }

    }, {
      action: 'write',
      data: {
        ...Support.Document2.doc,
        name: '8.01 Classical Mechanics Pset 1',
        encoding: [ Support.Document2.doc.encoding[0]["@id"] ],
        tag: Support.sortArray(Support.Document2.tags.map(x => x["@id"])),
        annotation: Support.sortArray(Support.Document2.annotations.map(x => x["@id"])),
      },
      key: Support.Document2.doc['@id'],
      label: NAME,
    });

    // Wait for videoAnnotations
    setTimeout(() => {
      _resolve3(videoAnnotations);
    }, 5000);

    const result3 = await resultPromise3;
    console.log('Result3 data:', JSON.stringify(result3));
    t.deepEqual(result3, Support.annotations);

    // Wait for videoAnnotations
    setTimeout(() => {
      _resolve4(documentAnnotations);
    }, 5000);

    const result4 = await resultPromise4;
    console.log('Result4 data:', JSON.stringify(result4));
    t.deepEqual(result4, Support.Document2.annotations);

  } catch(e) {
    console.error(e);
    throw e;
  }
});

// test('it works with documents', async (t) => {
//   try {
//     let _resolve, _reject;
//     const resultPromise = new Promise((resolve, reject) => {
//       _resolve = resolve;
//       _reject = reject;
//     });
//
//     const receive = (message) => {
//       console.log('Received message!', message);
//       if ([].concat(message.data["@type"]).find(type => type === "Document")) _resolve(message);
//     };
//
//     const send = await memux({
//       name: 'dummy-broker',
//       url: KAFKA_ADDRESS,
//       input: OUTPUT_TOPIC,
//       output: INPUT_TOPIC,
//       receive,
//       options: {
//         concurrency: 1
//       }
//     });
//
//     await init({
//       name: NAME,
//     });
//
//     await send({ action: 'write', key: Support.document['@id'], data: Support.document });
//
//     const result = await resultPromise;
//     console.log('Result data:', result.data);
//     return t.deepEqual({
//       ...result,
//       data: {
//         ...result.data,
//         tag: Support.sortArray(result.data.tag),
//       }
//
//     }, {
//       action: 'write',
//       data: {
//         ...Support.document,
//         tag: Support.sortArray(Support.documentTags),
//         annotation: Support.documentAnnotations,
//       },
//       key: Support.document['@id'],
//       label: NAME,
//     });
//   } catch(e) {
//     console.error(e);
//     throw e;
//   }
// });
