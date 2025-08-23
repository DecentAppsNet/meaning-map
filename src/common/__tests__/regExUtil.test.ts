import { describe, it, expect } from 'vitest';
import { createNonGlobalRegex, escapeRegexCharacters } from '../regExUtil';

describe('regExUtil', () => {
  describe('escapeRegexCharacters()', () => {
    it('empty string -> empty string', () => {
      expect(escapeRegexCharacters('')).toBe('');
    });

    it('no special characters -> same string', () => {
      expect(escapeRegexCharacters('abc')).toBe('abc');
    });

    it('special characters in middle of string -> escaped string', () => {
      expect(escapeRegexCharacters('a.b')).toBe('a\\.b');
    });

    it('special characters at start of string -> escaped string', () => {
      expect(escapeRegexCharacters('.ab')).toBe('\\.ab');
    });

    it('special characters at end of string -> escaped string', () => {
      expect(escapeRegexCharacters('ab.')).toBe('ab\\.');
    });

    it('multiple special characters in middle of string -> escaped string', () => {
      expect(escapeRegexCharacters('a.b.c')).toBe('a\\.b\\.c');
    });

    // No point in testing all special characters, as that would just be a 
    // restatement of the regex.
  });

  describe('createNonGlobalRegex()', () => {
    it('regex is global -> regex is non-global', () => {
      const regex = /abc/g;
      const result = createNonGlobalRegex(regex);
      expect(result).not.toBe(regex);
      expect(result.source).toBe(regex.source);
      expect(result.flags).toBe('');
    });

    it('regex is not global -> same regex', () => {
      const regex = /abc/;
      const result = createNonGlobalRegex(regex);
      expect(result).toBe(regex);
    });

    it('regex is empty -> same regex', () => {
      const regex = /(?:)/;
      const result = createNonGlobalRegex(regex);
      expect(result).toBe(regex);
    });
  });
});