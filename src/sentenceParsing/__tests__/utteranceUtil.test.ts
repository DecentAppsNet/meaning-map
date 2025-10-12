import { describe, it, expect } from 'vitest';
import { normalizeUtterance, isUtteranceNormalized, findParamsInUtterance,
  isMatchingParam, utteranceToWords, isValidUtterance, isPlainUtterance, wordsToUtterance, 
  punctuatedToUtterance} from '../utteranceUtil';

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

  describe('isMatchingParam()', () => {
    it('returns true when word is ALLCAPS and baseParamName matches', () => {
      expect(isMatchingParam('NUMBER2', 'NUMBER')).toBe(true);
      expect(isMatchingParam('ITEMS', 'ITEMS')).toBe(true);
    });

    it('returns false for lowercase words or base mismatch', () => {
      expect(isMatchingParam('number2', 'NUMBER')).toBe(false);
      expect(isMatchingParam('NUMBER2', 'ITEMS')).toBe(false);
    });
  });

  describe('utteranceToWords()', () => {
    it('splits a normalized utterance into words', () => {
      expect(utteranceToWords('hello world')).toEqual(['hello', 'world']);
    });

    it('throws when called with non-normalized utterance', () => {
      expect(() => utteranceToWords('Hello World')).toThrow();
    });
  });

  describe('isValidUtterance()', () => {
    it('returns true for non-empty normalized utterance', () => {
      expect(isValidUtterance('hello world')).toBe(true);
    });

    it('returns false for empty or non-normalized utterance', () => {
      expect(isValidUtterance('')).toBe(false);
      expect(isValidUtterance('Hello WORLD')).toBe(false);
    });
  });

  describe('isPlainUtterance()', () => {
    it('returns true for normalized utterance with no ALLCAPS params', () => {
      expect(isPlainUtterance('move items to box')).toBe(true);
    });

    it('returns false for normalized utterance containing ALLCAPS params', () => {
      expect(isPlainUtterance('move ITEMS to box')).toBe(false);
    });

    it('returns false for invalid utterance', () => {
      expect(isPlainUtterance('move ItEmS to box')).toBe(false);
    });
  });

  describe('wordsToUtterance()', () => {
    it('joins single word array into that word', () => {
      expect(wordsToUtterance(['hello'])).toBe('hello');
    });

    it('joins multiple words with single spaces', () => {
      expect(wordsToUtterance(['hello','world'])).toBe('hello world');
    });

    it('preserves ALLCAPS tokens', () => {
      expect(wordsToUtterance(['MOVE','ITEMS','here'])).toBe('MOVE ITEMS here');
    });
  });

  describe('findParamsInUtterance()', () => {
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

  describe('punctuatedToUtterance()', () => {
    it('removes ASCII punctuation and lowercases text', () => {
      expect(punctuatedToUtterance('Hello, world!')).toBe('hello world');
      expect(punctuatedToUtterance('This... is a test.')).toBe('this is a test');
    });

    it('handles mixed punctuation and parentheses', () => {
      expect(punctuatedToUtterance('Hi! (How are you?)')).toBe('hi how are you');
      expect(punctuatedToUtterance('A: B; C, D.')).toBe('a b c d');
    });

    it('handles unicode punctuation characters', () => {
      expect(punctuatedToUtterance('«Hello» “world”…')).toBe('hello world');
    });
  });
});
