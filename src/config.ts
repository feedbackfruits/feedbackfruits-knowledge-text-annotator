require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'updates',
  OUTPUT_TOPIC = 'update_requests',
  EXTRACTOR_URL = 'https://staging-fbf-entities.herokuapp.com/concepts/',
  ANNOTATOR_URL = 'http://ec2-34-212-79-22.us-west-2.compute.amazonaws.com/rest/annotate',
  MEDIA_URL = 'https://staging-media.feedbackfruits.com/'
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  EXTRACTOR_URL,
  ANNOTATOR_URL,
  MEDIA_URL,
};
