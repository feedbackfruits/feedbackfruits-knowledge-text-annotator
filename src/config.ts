require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'updates',
  OUTPUT_TOPIC = 'update_requests',
  EXTRACTOR_URL = 'https://staging-fbf-entities.herokuapp.com/concepts/',
  MEDIA_URL = 'https://staging-media.feedbackfruits.com/'
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  EXTRACTOR_URL,
  MEDIA_URL,
};
