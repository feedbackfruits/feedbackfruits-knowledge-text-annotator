require('dotenv').config();

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'updates',
  OUTPUT_TOPIC = 'update_requests',
  MEDIA_URL = 'https://staging-media.feedbackfruits.com',
  RETRIEVE_URL = 'http://localhost:5000',
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  MEDIA_URL,
  RETRIEVE_URL,
};
