export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  text: string;
}

export interface SessionAttributes {
  chatHistory?: ChatTurn[];
}
