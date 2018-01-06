import test from 'ava';

import memux from 'memux';
import init from '../lib';
import { NAME, KAFKA_ADDRESS, OUTPUT_TOPIC, INPUT_TOPIC, PAGE_SIZE, START_PAGE } from '../lib/config';

test('it exists', t => {
  t.not(init, undefined);
});

const captions = require('./support/captions');
const videoDoc = { ...require('./support/doc.json'), 'https://knowledge.express/caption': captions };

const tags = require('./support/tags');
const annotations = require('./support/annotations');

test('it works', async (t) => {
  try {
    let _resolve, _reject;
    const resultPromise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const receive = (message) => {
      console.log('Received message!', message);
      _resolve(message);
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

    await send({ action: 'write', key: videoDoc['@id'], data: videoDoc });

    const result = await resultPromise;
    console.log('Result data:', result.data);
    return t.deepEqual(result, {
      action: 'write',
      data: {
        ...videoDoc,
        ['https://knowledge.express/tag']: tags,
        ['https://knowledge.express/annotation']: annotations
      },
      key: 'https://www.youtube.com/watch?v=pi3WWQ0q6Lc',
      label: NAME,
    });
  } catch(e) {
    console.error(e);
    throw e;
  }
});
