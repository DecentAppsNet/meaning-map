// Module-scope variables used by the mocked helpers
let theCachedResponse: string | null = null;
let lastFetchArgs: any = null;
let theFetchResponse: any = { choices: [{ message: { content: 'fetched-response' } }] };

// Mocks before importing modules that use them.
vi.mock('../../common/httpUtil', async () => ({
  fetchJsonWithAuth: vi.fn(async (url:string, apiKey:string, body:any) => {
    lastFetchArgs = { url, apiKey, body };
    return Promise.resolve(theFetchResponse);
  })
}));

vi.mock('../promptCache', async () => {
  const actual = await vi.importActual('../promptCache');
  return {
    getRequestHash: actual.getRequestHash,
    getCachedResponse: vi.fn(async (_h:string) => theCachedResponse),
    upsertCachedResponse: vi.fn(async (_h:string, _r:string) => { /* noop */ })
  };
});

// Imports after mocks
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prompt } from '../llmUtil';

describe('llmUtil', () => {
  beforeEach(() => {
    theCachedResponse = null;
    lastFetchArgs = null;
    theFetchResponse = { choices: [{ message: { content: 'fetched-response' } }] };
    process.env.OPENAI_API_KEY = 'test-key';
  });

  describe('prompt()', () => {
    it('throws if OPENAI_API_KEY env variable is undefined', async () => {
      process.env.OPENAI_API_KEY = '';
      await expect(prompt('hi', '', [])).rejects.toThrow();
    });

    it('returns cached response when present', async () => {
      theCachedResponse = 'cached!';
      const out = await prompt('hi', '', []);
      expect(out).toBe('cached!');
    });

    it('fetches from API when no cached response', async () => {
      theCachedResponse = null;
      const out = await prompt('hello', '', []);
      expect(out).toBe('fetched-response');
    });

    it('sends system message when provided', async () => {
      theCachedResponse = null;
      await prompt('p', 'SYSTEM', []);
      expect(lastFetchArgs.body.messages[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    });

    it('sends n-shot pairs before prompt', async () => {
      theCachedResponse = null;
      const pairs = [{ userMessage: 'u1', assistantResponse: 'a1' }];
      await prompt('p', '', pairs as any);
      const msgs = lastFetchArgs.body.messages;
      // user then assistant then final user
      expect(msgs[msgs.length - 3]).toEqual({ role: 'user', content: 'u1' });
      expect(msgs[msgs.length - 2]).toEqual({ role: 'assistant', content: 'a1' });
      expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'p' });
    });

    it('sends system + n-shot + prompt in that order', async () => {
      theCachedResponse = null;
      const pairs = [{ userMessage: 'u1', assistantResponse: 'a1' }];
      await prompt('final', 'SYS', pairs as any);
      const msgs = lastFetchArgs.body.messages;
      expect(msgs[0]).toEqual({ role: 'system', content: 'SYS' });
      expect(msgs[1]).toEqual({ role: 'user', content: 'u1' });
      expect(msgs[2]).toEqual({ role: 'assistant', content: 'a1' });
      expect(msgs[3]).toEqual({ role: 'user', content: 'final' });
    });

    it('handles text-based completions fallback (choice.text)', async () => {
      theCachedResponse = null;
      theFetchResponse = { choices: [{ text: 'plain-text-response' }] };
      const out = await prompt('hello', '', []);
      expect(out).toBe('plain-text-response');
    });

    it('throws when API returns non-JSON HTML (simulated 404)', async () => {
      theCachedResponse = null;
      theFetchResponse = '<html>Not Found</html>';
      await expect(prompt('x', '', [])).rejects.toThrow();
    });
  });
});
