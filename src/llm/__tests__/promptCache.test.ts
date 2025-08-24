// Module-scope backing store used by the mocked fileUtil functions.
let theCache: Record<string, string> = {};

// Mocks first before importing modules that may use them.
vi.mock("../../common/fileUtil", async () => ({
  readJsonFile: vi.fn(async (_filePath:string, _defaultValue:any, validator?: (v:any)=>boolean) => {
    if (validator && !validator(theCache)) throw new Error('Invalid format');
    return Promise.resolve(theCache);
  }),
  writeJsonFile: vi.fn(async (_filePath:string, data) => { theCache = data; })
}));

// Imports after mocks.
import { getRequestHash, getCachedResponse, upsertCachedResponse, clearCache } from '../promptCache';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('promptCache', () => {
  beforeEach(async () => {
    theCache = {};
    await clearCache();
  });

  describe('getRequestHash()', () => {
    it('returns identical hashes for identical message sequences and different for different ones', () => {
      const a = [{ role: 'user', content: 'hello' }];
      const b = [{ role: 'user', content: 'hello' }];
      const c = [{ role: 'user', content: 'goodbye' }];

      const ha = getRequestHash(a as any);
      const hb = getRequestHash(b as any);
      const hc = getRequestHash(c as any);

      expect(ha).toBe(hb);
      expect(ha).not.toBe(hc);
    });
  });

  describe('getCachedResponse()', () => {
    it('returns null if no matching response has been cached', async () => {
      const val = await getCachedResponse('no-such-hash');
      expect(val).toBeNull();
    });

    it('returns a cached response when present in the backing store', async () => {
      upsertCachedResponse('h1', 'cached-response');
      const val = await getCachedResponse('h1');
      expect(val).toBe('cached-response');
    });
  });

  describe('upsertCachedResponse()', () => {
    it('stores a response and subsequent reads return it', async () => {
      await upsertCachedResponse('u1', 'resp-one');

      const got = await getCachedResponse('u1');
      expect(got).toBe('resp-one');

      // The mocked writeJsonFile assigns to theCache, so it should contain the new value
      expect(theCache['u1']).toBe('resp-one');
    });
  });

  describe('clearCache()', () => {
    it('clears existing entries so subsequent reads return null', async () => {
      await upsertCachedResponse('z', 'to-be-cleared');

      // ensure present
      expect(await getCachedResponse('z')).toBe('to-be-cleared');

      await clearCache();
      expect(await getCachedResponse('z')).toBeNull();
    });

    it('throws when the backing JSON is an invalid format', async () => {
      // place invalid structure in the mocked backing store
      // (e.g., an array instead of an object)
      (theCache as any) = [];

      // Force promptCache to be reloaded so its internal cache is cleared and readJsonFile is invoked
      vi.resetModules();
      const { getCachedResponse: getCachedResponse2 } = await import('../promptCache');

      await expect(getCachedResponse2('any')).rejects.toThrow();
    });
  });
});