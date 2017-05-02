require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator-v3',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'quad_updates',
  OUTPUT_TOPIC = 'quad_update_requests',
} = process.env;

const EXTRACTOR_URL = 'https://staging-fbf-entities.herokuapp.com/concepts/';

const memux = require('memux');
const PQueue = require('p-queue');
const fetch = require('node-fetch');

const { source, sink, send } = memux({
  name: NAME,
  url: KAFKA_ADDRESS,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC
});

const queue = new PQueue({
  concurrency: 16
});

const regex = /^https:\/\/en\.wikipedia\.org\/wiki\/(.*)$/
const done = {};

source.flatMap(({ action: { type, quad: { subject, predicate, object } }, progress }) => {
  if (predicate !== '<http://schema.org/text>') return Promise.resolve(progress);
  if (object.trim().length === 0) return Promise.resolve(progress);
  if (object in done) return Promise.resolve(progress);

  return queue.add(() => {
    return fetch(EXTRACTOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ text: object.replace(/[^\w]/g, ' ').trim() })
    }).then(response => response.text()).then(text => {
      let data;

      try {
        data = (text == '' || !text) ? { concepts: [] } : JSON.parse(text);
      } catch(error) {
        console.log("TEXT:", text);
        throw error;
      }

      console.log('DATA: ', data);
      return Promise.all(data.concepts.map(e => {
        const match = e.link.match(regex);
        const id = match[1];
        const quad = {
          subject,
          predicate: '<http://schema.org/about>',
          object: `<http://dbpedia.org/resource/${id}>`
        };

        return send({ type: 'write', quad }).then(() => done[object] = true);
      })).catch(err => {
        console.error(err);
        throw err;
      });
    });
  }).then(() => progress);
}).subscribe(sink);
