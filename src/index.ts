import 'dotenv/config';
import { buildLambdaHandler } from './handlers';
import { GeminiChatClient } from './openaiClient';

const chatClient = new GeminiChatClient();

export const handler = buildLambdaHandler(chatClient);
