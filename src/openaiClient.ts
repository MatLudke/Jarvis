import { ChatTurn } from './types';

const SYSTEM_PROMPT =
  'You are a concise and helpful assistant replying for Alexa voice output. Keep answers clear and conversational.';

export interface ChatClient {
  getAnswer(question: string, history: ChatTurn[]): Promise<string>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function extractResponseText(response: any): string {
  // Flexible parsing to accommodate different Gemini/AI Studio response shapes.
  if (!response) throw new Error('Empty response from Gemini API');
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();

  // Newer responses may include candidates or content arrays
  if (Array.isArray(response.candidates) && response.candidates.length > 0) {
    const first = response.candidates[0];
    if (typeof first.output_text === 'string' && first.output_text.trim()) return first.output_text.trim();
    if (first.content) {
      if (Array.isArray(first.content)) {
        return first.content.map((c: any) => c.text || '').join(' ').trim();
      }
      if (typeof first.content === 'string') return first.content.trim();
    }
  }

  // Fallback: try `responses` style
  if (Array.isArray(response.responses)) {
    const parts: string[] = [];
    for (const r of response.responses) {
      if (typeof r.output_text === 'string') parts.push(r.output_text);
      if (Array.isArray(r.candidates)) {
        for (const c of r.candidates) if (c.output_text) parts.push(c.output_text);
      }
    }
    const merged = parts.join(' ').trim();
    if (merged) return merged;
  }

  throw new Error('Gemini response did not contain text output.');
}

export class GeminiChatClient implements ChatClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor(
    apiKey: string = requireEnv('GEMINI_API_KEY'),
    apiUrl: string = process.env.GEMINI_API_URL ?? requireEnv('GEMINI_API_URL'),
    model: string = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'
  ) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = model;
  }

  private buildMessages(question: string, history: ChatTurn[]) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((t) => ({ role: t.role, content: t.text })),
      { role: 'user', content: question }
    ];
    return messages;
  }

  async getAnswer(question: string, history: ChatTurn[]): Promise<string> {
    const messages = this.buildMessages(question, history);
    const payload = {
      model: this.model,
      messages
    };

    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const json = await res.json();
    return extractResponseText(json);
  }
}
