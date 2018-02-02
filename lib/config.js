"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').load({ silent: true });
const { NAME = 'feedbackfruits-knowledge-text-annotator', KAFKA_ADDRESS = 'tcp://kafka:9092', INPUT_TOPIC = 'updates', OUTPUT_TOPIC = 'update_requests', RETRIEVE_URL = 'http://localhost:4000/retrieve', } = process.env;
exports.NAME = NAME;
exports.KAFKA_ADDRESS = KAFKA_ADDRESS;
exports.INPUT_TOPIC = INPUT_TOPIC;
exports.OUTPUT_TOPIC = OUTPUT_TOPIC;
exports.RETRIEVE_URL = RETRIEVE_URL;
