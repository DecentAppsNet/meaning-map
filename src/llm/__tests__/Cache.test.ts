import { describe, it, expect } from 'vitest';
import { isCacheFormat } from '../types/Cache';

describe('Cache', () => {
  describe('isCacheFormat()', () => {
    it('returns true for a plain object of string->string', () => {
      const ok = { 'h1': 'one', 'h2': 'two' };
      expect(isCacheFormat(ok)).toBe(true);
    });

    it('returns false for arrays', () => {
      expect(isCacheFormat([])).toBe(false);
      expect(isCacheFormat(['a','b'])).toBe(false);
    });

    it('returns true for an empty object', () => {
      expect(isCacheFormat({})).toBe(true);
    });

    it('returns false for objects with non-string values', () => {
      expect(isCacheFormat({ a: 1 as any })).toBe(false);
      expect(isCacheFormat({ a: null as any })).toBe(false);
    });

    it('returns false for primitives and null/undefined', () => {
      expect(isCacheFormat(null)).toBe(false);
      expect(isCacheFormat(undefined)).toBe(false);
      expect(isCacheFormat(42)).toBe(false);
      expect(isCacheFormat('x')).toBe(false);
    });
  });
});
