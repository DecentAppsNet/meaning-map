import { describe, it, expect } from 'vitest';
import { normalizeUtterance, isUtteranceNormalized } from '../utteranceUtil';

describe('utteranceUtil', () => {
  describe('normalizeUtterance()', () => {
    it('lowercases and collapses spaces', () => {
      expect(normalizeUtterance('  Hello   World  ')).toBe('hello world');
    });

    it('lowercases a single-letter uppercase word', () => {
      expect(normalizeUtterance('I am here')).toBe('i am here');
    });

    it('preserves ALLCAPS tokens as-is', () => {
      expect(normalizeUtterance('MOVE ITEMS to Box')).toBe('MOVE ITEMS to box');
    });

    it('removes empty tokens', () => {
      expect(normalizeUtterance('   ')).toBe('');
    });
  });

  describe('isUtteranceNormalized()', () => {
    it('returns true for normalized string', () => {
      expect(isUtteranceNormalized('hello world')).toBe(true);
    });

    it('returns false for non-normalized string', () => {
      expect(isUtteranceNormalized('Hello WORLD')).toBe(false);
    });
  });
});
