"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalErrorHandler = exports.IntentReflectorHandler = exports.SessionEndedRequestHandler = exports.CancelAndStopIntentHandler = exports.HelpIntentHandler = exports.LaunchRequestHandler = void 0;
exports.createChatIntentHandler = createChatIntentHandler;
exports.createFallbackIntentHandler = createFallbackIntentHandler;
exports.buildLambdaHandler = buildLambdaHandler;
const ask_sdk_core_1 = require("ask-sdk-core");
const sessionMemory_1 = require("./sessionMemory");
const HELP_TEXT = "You can ask me anything. For example, say: ask Jarvis, what's the tallest mountain?";
const REPROMPT_TEXT = 'Ask me another question whenever you are ready.';
function getIntentName(input) {
    const request = input.requestEnvelope.request;
    if (request.type !== 'IntentRequest') {
        return undefined;
    }
    return request.intent.name;
}
function sanitizeSpeech(text) {
    return text.replace(/[<>]/g, '').trim();
}
function createChatIntentHandler(chatClient) {
    return {
        canHandle(handlerInput) {
            return getIntentName(handlerInput) === 'AskChatGPTIntent';
        },
        async handle(handlerInput) {
            const intentRequest = handlerInput.requestEnvelope.request;
            if (intentRequest.type !== 'IntentRequest') {
                throw new Error('AskChatGPTIntent handler received non-intent request.');
            }
            const question = intentRequest.intent.slots?.question?.value?.trim();
            if (!question) {
                return handlerInput.responseBuilder
                    .speak('I did not catch your question. Please try again.')
                    .reprompt(REPROMPT_TEXT)
                    .getResponse();
            }
            const attributes = handlerInput.attributesManager.getSessionAttributes();
            const history = (0, sessionMemory_1.getSessionHistory)(attributes);
            const answer = await chatClient.getAnswer(question, history);
            const safeAnswer = sanitizeSpeech(answer);
            const nextAttributes = (0, sessionMemory_1.updateSessionHistory)(attributes, question, safeAnswer);
            handlerInput.attributesManager.setSessionAttributes(nextAttributes);
            return handlerInput.responseBuilder.speak(safeAnswer).reprompt(REPROMPT_TEXT).getResponse();
        }
    };
}
exports.LaunchRequestHandler = {
    canHandle(handlerInput) {
        return (0, ask_sdk_core_1.getRequestType)(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Welcome to Jarvis. Ask me a question to get started.')
            .reprompt(REPROMPT_TEXT)
            .getResponse();
    }
};
exports.HelpIntentHandler = {
    canHandle(handlerInput) {
        return getIntentName(handlerInput) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.speak(HELP_TEXT).reprompt(HELP_TEXT).getResponse();
    }
};
exports.CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        const intentName = getIntentName(handlerInput);
        return intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.speak('Goodbye!').getResponse();
    }
};
function createFallbackIntentHandler(chatClient) {
    return {
        canHandle(handlerInput) {
            return getIntentName(handlerInput) === 'AMAZON.FallbackIntent';
        },
        async handle(handlerInput) {
            try {
                const answer = await chatClient.getAnswer('Hello, explain briefly in one short sentence what you can do as Jarvis.', []);
                const safeAnswer = sanitizeSpeech(answer);
                return handlerInput.responseBuilder.speak(safeAnswer).reprompt(REPROMPT_TEXT).getResponse();
            }
            catch {
                return handlerInput.responseBuilder
                    .speak('I am Jarvis. You can ask me anything, for example: ask Jarvis, what is serverless computing?')
                    .reprompt(REPROMPT_TEXT)
                    .getResponse();
            }
        }
    };
}
exports.SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return (0, ask_sdk_core_1.getRequestType)(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};
exports.IntentReflectorHandler = {
    canHandle(handlerInput) {
        return (0, ask_sdk_core_1.getRequestType)(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = getIntentName(handlerInput) ?? 'unknown intent';
        return handlerInput.responseBuilder.speak(`You just triggered ${intentName}`).getResponse();
    }
};
exports.GlobalErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Skill error', error);
        const isKeyError = error instanceof Error && error.message.includes('GEMINI_API_KEY');
        const message = isKeyError
            ? 'Please set the GEMINI_API_KEY environment variable in your Alexa Lambda configuration.'
            : 'Sorry, I had trouble handling that request. Please try again.';
        return handlerInput.responseBuilder
            .speak(message)
            .reprompt(REPROMPT_TEXT)
            .getResponse();
    }
};
function buildLambdaHandler(chatClient) {
    return ask_sdk_core_1.SkillBuilders.custom()
        .addRequestHandlers(exports.LaunchRequestHandler, createChatIntentHandler(chatClient), exports.HelpIntentHandler, exports.CancelAndStopIntentHandler, createFallbackIntentHandler(chatClient), exports.SessionEndedRequestHandler, exports.IntentReflectorHandler)
        .addErrorHandlers(exports.GlobalErrorHandler)
        .lambda();
}
