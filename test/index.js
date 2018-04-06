import test from 'ava';

import memux from 'memux';
import nock from 'nock';
import init from '../lib';
import { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, PAGE_SIZE, START_PAGE, RETRIEVE_URL } from '../lib/config';

import * as Support from './support';

nock(RETRIEVE_URL)
  .post('/text?concepts&namedEntities')
  .reply(200, {
    concepts: Support.concepts,
    namedEntities: Support.namedEntities
   });

test('it exists', t => {
  t.not(init, undefined);
});

test('it works', async (t) => {
  try {
    let _resolve, _reject;
    const resultPromise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const receive = (message) => {
      console.log('Received message!', message);
      if ([].concat(message.data["@type"]).find(type => type === "VideoObject")) _resolve(message);
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

    await send({ action: 'write', key: Support.doc['@id'], data: Support.doc });

    const result = await resultPromise;
    console.log('Result data:', result.data);
    return t.deepEqual({
      ...result,
      data: {
        ...result.data,
        caption: Support.sortArray(result.data.caption),
        tag: Support.sortArray(result.data.tag),
      }
    }, {
      action: 'write',
      data: {
        ...Support.doc,
        caption: Support.sortArray(Support.doc.caption), //.map(c => c["@id"])),
        tag: Support.sortArray(Support.tags), //.map(c => c["@id"])),
        annotation: Support.annotations,
      },
      key: Support.doc['@id'],
      label: NAME,
    });
  } catch(e) {
    console.error(e);
    throw e;
  }
});
