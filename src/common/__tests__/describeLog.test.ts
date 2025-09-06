import { describe, it, expect } from 'vitest';
import { flushLog, log, startSection, endSection, doesLogInclude } from '../describeLog';
import { disableConsoleError, reenableConsoleError } from '@/common/testUtil';

describe('describeLog', () => {
  describe('flushLog()', () => {
    it('returns joined lines and clears the buffer', () => {
      flushLog();
      log('first');
      log('second');
      const out = flushLog();
      expect(out).toBe('first\nsecond');
      // buffer cleared
      expect(flushLog()).toBe('');
    });
  });

  describe('sections', () => {
    it('emits section markers and indented lines', () => {
      flushLog();
      log('a');
      startSection('section1');
      log('b');
      endSection();
      log('c');

      const out = flushLog();
      const lines = out.split('\n');
      expect(lines[0]).toBe('a');
      expect(lines[1]).toBe('section1 {');
      expect(lines[2]).toBe('  b');
      expect(lines[3]).toBe('}');
      expect(lines[4]).toBe('c');
    });

    it('allows endSection() when no active section and logs closing brace', () => {
      flushLog();
      disableConsoleError();
      try {
        expect(() => endSection()).not.toThrow();
      } finally {
        reenableConsoleError();
      }
      expect(flushLog()).toBe('}');
    });
  });

  describe('doesLogInclude()', () => {
    it('returns true for empty search string when buffer has content', () => {
      flushLog();
      log('first');
      expect(doesLogInclude('')).toBe(true);
    });

    it('returns false when there is no match', () => {
      flushLog();
      log('hello');
      log('world');
      expect(doesLogInclude('foo')).toBe(false);
    });

    it('finds a match on the first line', () => {
      flushLog();
      log('match-me');
      log('other');
      expect(doesLogInclude('match-me')).toBe(true);
    });

    it('finds a match on a line after the first', () => {
      flushLog();
      log('first-line');
      log('second-line');
      expect(doesLogInclude('second-line')).toBe(true);
    });

    it('returns false against an empty buffer', () => {
      flushLog();
      expect(doesLogInclude('anything')).toBe(false);
      expect(doesLogInclude('')).toBe(false);
    });
  });
});
