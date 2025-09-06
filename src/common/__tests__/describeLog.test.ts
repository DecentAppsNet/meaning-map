import { describe, it, expect } from 'vitest';
import { flush, log, startSection, endSection, includes } from '../describeLog';
import { disableConsoleError, reenableConsoleError } from '@/common/testUtil';

describe('describeLog', () => {
  describe('flush()', () => {
    it('returns joined lines and clears the buffer', () => {
      flush();
      log('first');
      log('second');
      const out = flush();
      expect(out).toBe('first\nsecond');
      // buffer cleared
      expect(flush()).toBe('');
    });
  });

  describe('sections', () => {
    it('emits section markers and indented lines', () => {
      flush();
      log('a');
      startSection('section1');
      log('b');
      endSection();
      log('c');

      const out = flush();
      const lines = out.split('\n');
      expect(lines[0]).toBe('a');
      expect(lines[1]).toBe('section1 {');
      expect(lines[2]).toBe('  b');
      expect(lines[3]).toBe('}');
      expect(lines[4]).toBe('c');
    });

    it('allows endSection() when no active section and logs closing brace', () => {
      flush();
      disableConsoleError();
      try {
        expect(() => endSection()).not.toThrow();
      } finally {
        reenableConsoleError();
      }
      expect(flush()).toBe('}');
    });
  });

  describe('includes()', () => {
    it('returns true for empty search string when buffer has content', () => {
      flush();
      log('first');
      expect(includes('')).toBe(true);
    });

    it('returns false when there is no match', () => {
      flush();
      log('hello');
      log('world');
      expect(includes('foo')).toBe(false);
    });

    it('finds a match on the first line', () => {
      flush();
      log('match-me');
      log('other');
      expect(includes('match-me')).toBe(true);
    });

    it('finds a match on a line after the first', () => {
      flush();
      log('first-line');
      log('second-line');
      expect(includes('second-line')).toBe(true);
    });

    it('returns false against an empty buffer', () => {
      flush();
      expect(includes('anything')).toBe(false);
      expect(includes('')).toBe(false);
    });
  });
});
