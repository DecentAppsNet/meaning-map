import { describe, it, expect } from 'vitest';
import { makeReplacements, TextReplacement } from '../stringUtil';

describe('stringUtil', () => {
  describe('makeReplacements', () => {
    it('returns original when no replacements', () => {
      const s = 'hello world';
      const out = makeReplacements(s, []);
      expect(out).toBe(s);
    });

    it('applies a single replacement', () => {
      const s = 'I have a red sweater.';
      const repls:TextReplacement[] = [{ fromPos: 7, toPos: 20, replacementText: 'ITEMS' }];
      const out = makeReplacements(s, repls);
      expect(out).toBe('I have ITEMS.');
    });

    it('handles replacements passed in reversed order (sorts them)', () => {
      const s = 'one two three four';
      // Intentionally pass in reverse order
      const repls:TextReplacement[] = [
        { fromPos: 8, toPos: 13, replacementText: 'B' },
        { fromPos: 0, toPos: 3, replacementText: 'A' }
      ];
      const out = makeReplacements(s, repls);
      expect(out).toBe('A two B four');
    });

    it('throws when a replacement has fromPos >= toPos', () => {
      const s = 'hello world';
      const repls:TextReplacement[] = [{ fromPos: 5, toPos: 5, replacementText: 'X' }];
      expect(() => makeReplacements(s, repls)).toThrow();
    });

    it('throws when replacements overlap', () => {
      const s = 'abcdefghij';
      const repls:TextReplacement[] = [
        { fromPos: 0, toPos: 5, replacementText: 'A' },
        { fromPos: 4, toPos: 7, replacementText: 'B' }
      ];
      expect(() => makeReplacements(s, repls)).toThrow();
    });

    it('applies multiple replacements in order', () => {
      const s = 'one two three four';
      const repls:TextReplacement[] = [
        { fromPos: 0, toPos: 3, replacementText: 'A' },
        { fromPos: 8, toPos: 13, replacementText: 'B' }
      ];
      const out = makeReplacements(s, repls);
      expect(out).toBe('A two B four');
    });
  });
});