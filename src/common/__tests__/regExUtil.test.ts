import { describe, it, expect } from 'vitest';
import { createNonGlobalRegex, escapeRegexCharacters, extractAllCapsWords, findNonWhitespace, findWhitespace, isWhiteSpaceChar, isDigitChar, hasNonPosixFilepathChars } from '../regExUtil';

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

  describe('extractAllCapsWords()', () => {
    it('returns empty for empty string', () => {
      expect(extractAllCapsWords('')).toEqual([]);
    });

    it('returns empty for single uppercase letter', () => {
      expect(extractAllCapsWords('X')).toEqual([]);
    });

    it('returns a two-letter uppercase token', () => {
      expect(extractAllCapsWords('XX')).toEqual(['XX']);
    });

    it('returns empty for mixed-case variants', () => {
      expect(extractAllCapsWords('xXX')).toEqual([]);
      expect(extractAllCapsWords('XxX')).toEqual([]);
      expect(extractAllCapsWords('XXx')).toEqual([]);
    });

    it('returns empty when text contains no all-caps words', () => {
      expect(extractAllCapsWords('no caps here')).toEqual([]);
    });
  });

  describe('isWhiteSpaceChar()', () => {
    it('detects whitespace characters', () => {
      expect(isWhiteSpaceChar(' ')).toBe(true);
      expect(isWhiteSpaceChar('\t')).toBe(true);
      expect(isWhiteSpaceChar('a')).toBe(false);
    });
  });

  describe('isDigitChar()', () => {
    it('detects digit characters', () => {
      expect(isDigitChar('0')).toBe(true);
      expect(isDigitChar('9')).toBe(true);
      expect(isDigitChar('a')).toBe(false);
      expect(isDigitChar('.')).toBe(false);
    });
  });

  describe('findWhitespace()', () => {
    it('finds index of first whitespace', () => {
      expect(findWhitespace('abc def')).toBe(3);
      expect(findWhitespace('abc')).toBe(-1);
      expect(findWhitespace('   ')).toBe(0);
    });
  });

  describe('findNonWhitespace()', () => {
    it('finds index of first non-whitespace', () => {
      expect(findNonWhitespace('   abc')).toBe(3);
      expect(findNonWhitespace('abc')).toBe(0);
      expect(findNonWhitespace('   ')).toBe(-1);
    });
  });

  describe('hasNonPosixFilepathChars()', () => {
    it('returns false for empty and simple posix filepaths', () => {
      expect(hasNonPosixFilepathChars('')).toBe(false);
      expect(hasNonPosixFilepathChars('abc')).toBe(false);
      expect(hasNonPosixFilepathChars('dir/file.txt')).toBe(false);
      expect(hasNonPosixFilepathChars('./file')).toBe(false);
      expect(hasNonPosixFilepathChars('../file')).toBe(false);
      expect(hasNonPosixFilepathChars('file-name_1.2')).toBe(false);
    });

    it('returns true when path contains non-posix characters', () => {
      expect(hasNonPosixFilepathChars('file name')).toBe(true);
      expect(hasNonPosixFilepathChars('dir\\file')).toBe(true);
      expect(hasNonPosixFilepathChars('file:name')).toBe(true);
      expect(hasNonPosixFilepathChars('file*')).toBe(true);
      expect(hasNonPosixFilepathChars('file?txt')).toBe(true);
      expect(hasNonPosixFilepathChars('~file')).toBe(true);
    });
  });
});