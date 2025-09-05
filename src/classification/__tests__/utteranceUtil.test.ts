import { describe, it, expect } from 'vitest';
import { normalizeUtterance, isUtteranceNormalized, findParamsInUtterance } from '../utteranceUtil';

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

  describe('findParamsInUtterance()', () => {
    it('returns empty array for empty string', () => {
      expect(findParamsInUtterance('')).toEqual([]);
    });

    it('returns empty for single word with no match', () => {
      expect(findParamsInUtterance('hello')).toEqual([]);
    });

    it('returns single match for single ALLCAPS token', () => {
      expect(findParamsInUtterance('ITEMS')).toEqual(['ITEMS']);
    });

    it('returns empty for multiple words with no ALLCAPS', () => {
      expect(findParamsInUtterance('please add this')).toEqual([]);
    });

    it('finds one ALLCAPS token among lowercase words', () => {
      expect(findParamsInUtterance('put ITEMS here')).toEqual(['ITEMS']);
    });

    it('finds multiple ALLCAPS tokens in order', () => {
      expect(findParamsInUtterance('move ITEMS to NUMBER')).toEqual(['ITEMS', 'NUMBER']);
    });
  });
});
