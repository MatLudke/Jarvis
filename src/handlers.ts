import {
  ErrorHandler,
  getRequestType,
  HandlerInput,
  RequestHandler,
  SkillBuilders
} from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { ChatClient } from './openaiClient';
import { getSessionHistory, updateSessionHistory } from './sessionMemory';
import { SessionAttributes } from './types';

const HELP_TEXT =
  "You can ask me anything. For example, say: ask Jarvis, what's the tallest mountain?";
const REPROMPT_TEXT = 'Ask me another question whenever you are ready.';

function getIntentName(input: HandlerInput): string | undefined {
  const request = input.requestEnvelope.request;
  if (request.type !== 'IntentRequest') {
    return undefined;
  }
  return request.intent.name;
}

function sanitizeSpeech(text: string): string {
  return text.replace(/[<>]/g, '').trim();
}

export function createChatIntentHandler(chatClient: ChatClient): RequestHandler {
  return {
    canHandle(handlerInput) {
      return getIntentName(handlerInput) === 'AskChatGPTIntent';
    },
    async handle(handlerInput): Promise<Response> {
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

      const attributes = handlerInput.attributesManager.getSessionAttributes() as SessionAttributes;
      const history = getSessionHistory(attributes);
      const answer = await chatClient.getAnswer(question, history);
      const safeAnswer = sanitizeSpeech(answer);
      const nextAttributes = updateSessionHistory(attributes, question, safeAnswer);
      handlerInput.attributesManager.setSessionAttributes(nextAttributes);

      return handlerInput.responseBuilder.speak(safeAnswer).reprompt(REPROMPT_TEXT).getResponse();
    }
  };
}

export const LaunchRequestHandler: RequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Welcome to Jarvis. Ask me a question to get started.')
      .reprompt(REPROMPT_TEXT)
      .getResponse();
  }
};

export const HelpIntentHandler: RequestHandler = {
  canHandle(handlerInput) {
    return getIntentName(handlerInput) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak(HELP_TEXT).reprompt(HELP_TEXT).getResponse();
  }
};

export const CancelAndStopIntentHandler: RequestHandler = {
  canHandle(handlerInput) {
    const intentName = getIntentName(handlerInput);
    return intentName === 'AMAZON.CancelIntent' || intentName === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak('Goodbye!').getResponse();
  }
};

export const FallbackIntentHandler: RequestHandler = {
  canHandle(handlerInput) {
    return getIntentName(handlerInput) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('I can help answer your questions. Try asking me something directly.')
      .reprompt(REPROMPT_TEXT)
      .getResponse();
  }
};

export const SessionEndedRequestHandler: RequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

export const IntentReflectorHandler: RequestHandler = {
  canHandle(handlerInput) {
    return getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = getIntentName(handlerInput) ?? 'unknown intent';
    return handlerInput.responseBuilder.speak(`You just triggered ${intentName}`).getResponse();
  }
};

export const GlobalErrorHandler: ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Skill error', error);
    return handlerInput.responseBuilder
      .speak('Sorry, I had trouble handling that request. Please try again.')
      .reprompt(REPROMPT_TEXT)
      .getResponse();
  }
};

export function buildLambdaHandler(chatClient: ChatClient) {
  return SkillBuilders.custom()
    .addRequestHandlers(
      LaunchRequestHandler,
      createChatIntentHandler(chatClient),
      HelpIntentHandler,
      CancelAndStopIntentHandler,
      FallbackIntentHandler,
      SessionEndedRequestHandler,
      IntentReflectorHandler
    )
    .addErrorHandlers(GlobalErrorHandler)
    .lambda();
}
