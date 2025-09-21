import { describe, it, expect } from 'vitest';
import { parseMeaningClassifications } from '../meaningClassificationsImporter';

describe('meaningClassificationsImporter', () => {
  describe('parseMeaningClassifications()', () => {
    it('returns empty classifications for empty text', () => {
      const out = parseMeaningClassifications('');
      expect(out).toEqual({});
    });

    it('parses one utterance under one meaning section', () => {
      const text = `1.1 greeting\nhello everybody`;
      const expected = {
        '1.1': ['hello everybody']
      };
      const out = parseMeaningClassifications(text);
      expect(out).toEqual(expected);
    });

    it('parses multiple utterances under one meaning section', () => {
      const text = `1.1 greeting\nhello everybody\nhi all`;
      const expected = {
        '1.1': ['hello everybody', 'hi all']
      };
      const out = parseMeaningClassifications(text);
      expect(out).toEqual(expected);
    });

    it('parses multiple meaning sections with utterances', () => {
      const text = `1.1 greeting\nhello everybody\nhi all\n2.1 farewell\ngoodbye now\nsee you later`;
      const expected = {
        '1.1': ['hello everybody', 'hi all'],
        '2.1': ['goodbye now', 'see you later']
      };
      const out = parseMeaningClassifications(text);
      expect(out).toEqual(expected);
    });

    it('ignores empty lines', () => {
      const text = `\n\n1.1 greeting\n\nhello everybody\n\nhi all\n\n2.1 farewell\n\ngoodbye now\n\nsee you later\n\n`;
      const expected = {
        '1.1': ['hello everybody', 'hi all'],
        '2.1': ['goodbye now', 'see you later']
      };
      const out = parseMeaningClassifications(text);
      expect(out).toEqual(expected);
    });

    it('parses meaning IDs with multiple digits and periods', () => {
      const text = `10.2.3 complex id\nutterance one\nutterance two\n20 another id\nutterance three`;
      const expected = {
        '10.2.3': ['utterance one', 'utterance two'],
        '20': ['utterance three']
      };
      const out = parseMeaningClassifications(text);
      expect(out).toEqual(expected);
    });

    it('throws when an utterance appears before any meaning ID', () => {
      const text = `hello there`;
      expect(() => parseMeaningClassifications(text)).toThrow(/Utterance found before any meaning ID/);
    });

    it('throws on duplicate utterances', () => {
      const text = `1.1 header\nhello\nhello`;
      expect(() => parseMeaningClassifications(text)).toThrow(/Duplicate utterance/);
    });

    it('throws on invalid (non-normalized) utterance', () => {
      const text = `1.1 header\nHello World`;
      expect(() => parseMeaningClassifications(text)).toThrow(/Invalid utterance/);
    });

    it('treats a line like "3. Yes" as a heading for meaningId "3"', () => {
      const text = `3. Yes\nhello`;
      const out = parseMeaningClassifications(text);
      expect(out).toEqual({ '3': ['hello'] });
    });

    it('treats a line like "3." (period then EOL) as a heading for meaningId "3"', () => {
      const text = `3.\nhi there`;
      const out = parseMeaningClassifications(text);
      expect(out).toEqual({ '3': ['hi there'] });
    });

    it('treats a line like "30" (multi-digit followed by EOL) as a heading for meaningId "30"', () => {
      const text = `30\nhey`;
      const out = parseMeaningClassifications(text);
      expect(out).toEqual({ '30': ['hey'] });
    }); 

    it('does not treat "3.junk" as a heading and it becomes an utterance in the current section', () => {
      const text = `1.1 header\nhello\n3.junk\nbye`;
      const out = parseMeaningClassifications(text);
      expect(out).toEqual({ '1.1': ['hello', '3.junk', 'bye'] });
    });
  });
});