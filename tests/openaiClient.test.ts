import { GeminiChatClient } from '../src/openaiClient';
import { ChatTurn } from '../src/types';

describe('GeminiChatClient', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns text from simple response shape', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ output_text: 'Gemini answer' })
    } as unknown as Response);

    const client = new GeminiChatClient('key', 'https://example.test/gemini', 'gemini-3.5-flash');
    const answer = await client.getAnswer('Hello', [{ role: 'user', text: 'Hi' } as ChatTurn]);

    expect(answer).toBe('Gemini answer');
  });

  it('throws on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'internal'
    } as unknown as Response);

    const client = new GeminiChatClient('key', 'https://example.test/gemini', 'gemini-3.5-flash');

    await expect(client.getAnswer('Hello', [])).rejects.toThrow(/Gemini API error/);
  });
});

