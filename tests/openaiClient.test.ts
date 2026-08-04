import { GeminiChatClient } from '../src/openaiClient';
import { ChatTurn } from '../src/types';

describe('GeminiChatClient', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });
  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch;
  });

  it('returns text from simple response shape', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output_text: 'Gemini answer' })
    });

    const client = new GeminiChatClient('key', 'https://example.test/gemini', 'gemini-3.5-flash');
    const answer = await client.getAnswer('Hello', [{ role: 'user', text: 'Hi' } as ChatTurn]);

    expect(answer).toBe('Gemini answer');
  });

  it('throws on non-ok response', async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'internal' });
    const client = new GeminiChatClient('key', 'https://example.test/gemini', 'gemini-3.5-flash');

    await expect(client.getAnswer('Hello', [])).rejects.toThrow(/Gemini API error/);
  });
});
