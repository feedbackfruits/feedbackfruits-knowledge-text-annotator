require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-text-annotator',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'updates',
  OUTPUT_TOPIC = 'update_requests',
  WATSON_URL = 'https://gateway.watsonplatform.net/natural-language-understanding/api/v1/analyze',
  ANNOTATOR_URL = 'http://ec2-34-212-79-22.us-west-2.compute.amazonaws.com/rest/annotate',
  MEDIA_URL = 'https://staging-media.feedbackfruits.com/',

  WATSON_USERNAME,
  WATSON_PASSWORD,
} = process.env;

export {
  NAME,
  KAFKA_ADDRESS,
  INPUT_TOPIC,
  OUTPUT_TOPIC,
  WATSON_URL,
  ANNOTATOR_URL,
  MEDIA_URL,

  WATSON_USERNAME,
  WATSON_PASSWORD,
};
