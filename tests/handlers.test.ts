import { HandlerInput } from 'ask-sdk-core';
import { createChatIntentHandler } from '../src/handlers';
import { ChatClient } from '../src/openaiClient';
import { SessionAttributes } from '../src/types';

interface MockResponse {
  outputSpeech?: { ssml?: string };
  reprompt?: { outputSpeech?: { ssml?: string } };
}

function getSpeechText(outputSpeech: unknown): string {
  if (!outputSpeech) {
    return '';
  }
  if (
    typeof outputSpeech === 'object' &&
    outputSpeech !== null &&
    'ssml' in outputSpeech &&
    typeof outputSpeech.ssml === 'string'
  ) {
    return outputSpeech.ssml;
  }
  if (
    typeof outputSpeech === 'object' &&
    outputSpeech !== null &&
    'text' in outputSpeech &&
    typeof outputSpeech.text === 'string'
  ) {
    return outputSpeech.text;
  }
  return '';
}

function createMockHandlerInput(question: string | undefined, sessionAttributes: SessionAttributes = {}): HandlerInput {
  let speechText = '';
  let repromptText = '';
  let attrs = sessionAttributes;

  const responseBuilder = {
    speak(text: string) {
      speechText = text;
      return this;
    },
    reprompt(text: string) {
      repromptText = text;
      return this;
    },
    getResponse(): MockResponse {
      return {
        outputSpeech: { ssml: `<speak>${speechText}</speak>` },
        reprompt: { outputSpeech: { ssml: `<speak>${repromptText}</speak>` } }
      };
    }
  };

  return {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AskChatGPTIntent',
          slots: question
            ? {
                question: {
                  name: 'question',
                  value: question
                }
              }
            : {}
        }
      }
    },
    attributesManager: {
      getSessionAttributes() {
        return attrs;
      },
      setSessionAttributes(next: SessionAttributes) {
        attrs = next;
      }
    },
    responseBuilder
  } as unknown as HandlerInput;
}

describe('Chat intent handler', () => {
  it('calls ChatClient and returns its answer', async () => {
    const chatClient: ChatClient = {
      getAnswer: jest.fn().mockResolvedValue('Here is your answer.')
    };
    const handler = createChatIntentHandler(chatClient);
    const input = createMockHandlerInput('What is serverless?');

    expect(handler.canHandle(input)).toBe(true);
    const response = await handler.handle(input);
    const ssml = getSpeechText(response.outputSpeech);

    expect(chatClient.getAnswer).toHaveBeenCalledTimes(1);
    expect(ssml).toContain('Here is your answer.');
  });

  it('asks user to retry when question slot is missing', async () => {
    const chatClient: ChatClient = {
      getAnswer: jest.fn()
    };
    const handler = createChatIntentHandler(chatClient);
    const input = createMockHandlerInput(undefined);

    const response = await handler.handle(input);
    const ssml = getSpeechText(response.outputSpeech);

    expect(chatClient.getAnswer).not.toHaveBeenCalled();
    expect(ssml).toContain('I did not catch your question');
  });
});
