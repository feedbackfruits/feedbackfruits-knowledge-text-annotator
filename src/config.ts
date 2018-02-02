require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'updates',
  OUTPUT_TOPIC = 'update_requests',
  RETRIEVE_URL = 'http://localhost:4000/retrieve',
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  RETRIEVE_URL,
};
