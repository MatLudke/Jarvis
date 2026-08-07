"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("dotenv/config");
const handlers_1 = require("./handlers");
const openaiClient_1 = require("./openaiClient");
const chatClient = new openaiClient_1.GeminiChatClient();
exports.handler = (0, handlers_1.buildLambdaHandler)(chatClient);
