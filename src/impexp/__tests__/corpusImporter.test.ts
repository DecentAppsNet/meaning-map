import { describe, it, expect } from 'vitest';
import { parseCorpus } from '../corpusImporter';

describe('corpusImporter', () => {
  describe('parseCorpus()', () => {
    it('returns empty array for empty text', () => {
      expect(parseCorpus('')).toEqual([]);
    });

    it('parses a single one-line text', () => {
      expect(parseCorpus('Hello')).toEqual(['hello']);
    });

    it('parses multi-line text into lines', () => {
      const txt = `Line one\nLine two\nLine three`;
      expect(parseCorpus(txt)).toEqual(['line one', 'line two', 'line three']);
    });

    it('trims whitespace at beginning and end of lines', () => {
      const txt = `  Leading\nTrailing  \n  Both  `;
      expect(parseCorpus(txt)).toEqual(['leading', 'trailing', 'both']);
    });

    it('converts lines to lower-case', () => {
      expect(parseCorpus('MiXeD')).toEqual(['mixed']);
    });

    it('ignores empty lines', () => {
      const txt = `a\n\n\nb`;
      expect(parseCorpus(txt)).toEqual(['a', 'b']);
    });

    it('ignores lines that contain only whitespace', () => {
      const txt = `a\n   \t  \nb`;
      expect(parseCorpus(txt)).toEqual(['a', 'b']);
    });

    it('dedupes identical normalized lines', () => {
      const txt = `Hello world\nhello   world\nHELLO WORLD`;
      expect(parseCorpus(txt)).toEqual(['hello world']);
    });

    it('collapses internal whitespace to a single space', () => {
      const txt = `a\t\t  b   c`;
      expect(parseCorpus(txt)).toEqual(['a b c']);
    });
  });
});
