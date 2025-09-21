import { describe, it, expect } from 'vitest';
import { parseNumberFromResponse } from '../llmResponseUtil';

describe('llmResponseUtil', () => {
  describe('parseNumberFromResponse()', () => {
    it('returns -1 when no digits present', () => {
      expect(parseNumberFromResponse('no numbers here')).toBe(-1);
    });

    it('parses a single number', () => {
      expect(parseNumberFromResponse('42')).toBe(42);
    });

    it('parses a number embedded in text and returns the first number', () => {
      expect(parseNumberFromResponse('Answer: 123 is the code')).toBe(123);
      expect(parseNumberFromResponse('Room 77 and 88')).toBe(77);
    });

    it('ignores leading/trailing whitespace', () => {
      expect(parseNumberFromResponse('   7   ')).toBe(7);
    });

    it('parses numbers adjacent to punctuation', () => {
      expect(parseNumberFromResponse('see 99, then go')).toBe(99);
      expect(parseNumberFromResponse('(100) people')).toBe(100);
    });
  });
});
