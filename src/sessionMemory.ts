import { ChatTurn, SessionAttributes } from './types';

const DEFAULT_MAX_SESSION_TURNS = 4;

function parseMaxSessionTurns(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_SESSION_TURNS;
  }
  return Math.floor(parsed);
}

export function getSessionHistory(attributes: SessionAttributes): ChatTurn[] {
  return Array.isArray(attributes.chatHistory) ? attributes.chatHistory : [];
}

export function updateSessionHistory(
  attributes: SessionAttributes,
  userQuestion: string,
  assistantAnswer: string
): SessionAttributes {
  const history = getSessionHistory(attributes);
  const maxTurns = parseMaxSessionTurns(process.env.MAX_SESSION_TURNS);
  const maxEntries = maxTurns * 2;
  const appendedHistory: ChatTurn[] = [
    ...history,
    { role: 'user', text: userQuestion },
    { role: 'assistant', text: assistantAnswer }
  ];
  const nextHistory = appendedHistory.slice(-maxEntries);

  return {
    ...attributes,
    chatHistory: nextHistory
  };
}
