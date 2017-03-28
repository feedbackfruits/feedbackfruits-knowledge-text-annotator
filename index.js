require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'quad_updates',
  OUTPUT_TOPIC = 'quad_update_requests',
} = process.env;

const EXTRACTOR_URL = 'https://feedbackfruits-entities.herokuapp.com/text/';

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
  concurrency: 8
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
        data = JSON.parse(text);
      } catch(error) {
        throw error;
      }

      return Promise.all(data.map(e => {
        const match = e.link.match(regex);
        const id = match[1];
        const quad = {
          subject,
          predicate: '<http://schema.org/about>',
          object: `<http://dbpedia.org/resource/${id}>`
        };

        return send({ type: 'write', quad }).then(() => done[object] = true);
      }));
    });
  }).then(() => progress);
}).subscribe(sink);
