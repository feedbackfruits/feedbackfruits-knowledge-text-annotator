import test from 'ava';

import memux from 'memux';
import nock from 'nock';
import init from '../lib';
import { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, PAGE_SIZE, START_PAGE, RETRIEVE_URL, MEDIA_URL } from '../lib/config';

import * as Support from './support';

nock(RETRIEVE_URL)
  .post('/text?concepts&namedEntities')
  .reply(200, {
    concepts: Support.concepts,
    namedEntities: Support.namedEntities
  })
  .persist();

nock(MEDIA_URL)
  .get('/5b0be26033bffd0025332deb/text.txt')
  .reply(200, Support.documentText)


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

    const receive = (message) => {
      console.log('Received message!', message);
      if ([].concat(message.data["@type"]).find(type => type === "VideoObject")) _resolve(message);
      if ([].concat(message.data["@type"]).find(type => type === "Document")) _resolve2(message);
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
      }
    }, {
      action: 'write',
      data: {
        ...Support.video,
        caption: Support.sortArray(Support.video.caption), //.map(c => c["@id"])),
        tag: Support.sortArray(Support.tags), //.map(c => c["@id"])),
        annotation: Support.annotations,
      },
      key: Support.video['@id'],
      label: NAME,
    });

    await send({ action: 'write', key: Support.document['@id'], data: Support.document });

    const result2 = await resultPromise2;
    console.log('Result2 data:', result2.data);
    return t.deepEqual({
      ...result2,
      data: {
        ...result2.data,
        tag: Support.sortArray(result2.data.tag),
      }

    }, {
      action: 'write',
      data: {
        ...Support.document,
        tag: Support.sortArray(Support.documentTags),
        annotation: Support.documentAnnotations,
      },
      key: Support.document['@id'],
      label: NAME,
    });

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
