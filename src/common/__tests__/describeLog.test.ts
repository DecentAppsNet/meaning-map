import { describe, it, expect, beforeEach } from 'vitest';
import { flushLog, log, startSection, endSection, doesLogInclude, setOnStatusCallback, setStatus, clearLog } from '../describeLog';
import { disableConsoleError, reenableConsoleError } from '@/common/testUtil';

describe('describeLog', () => {
  beforeEach(() => {
    clearLog();
  });

  describe('flushLog()', () => {
    it('returns joined lines and clears the buffer', () => {
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
      log('first');
      expect(doesLogInclude('')).toBe(true);
    });

    it('returns false when there is no match', () => {
      log('hello');
      log('world');
      expect(doesLogInclude('foo')).toBe(false);
    });

    it('finds a match on the first line', () => {
      log('match-me');
      log('other');
      expect(doesLogInclude('match-me')).toBe(true);
    });

    it('finds a match on a line after the first', () => {
      log('first-line');
      log('second-line');
      expect(doesLogInclude('second-line')).toBe(true);
    });

    it('returns false against an empty buffer', () => {
      expect(doesLogInclude('anything')).toBe(false);
      expect(doesLogInclude('')).toBe(false);
    });
  });

  describe('setStatus()', () => {
    it('calls status callback', () => {
      let message:string, completed:number, total:number;
      function _onStatus(m:string, c:number, t:number) {
        message = m; completed = c; total = t;
      }
      setOnStatusCallback(_onStatus);
      setStatus('banana', 4, 5);
      expect(message!).toBe('banana');
      expect(completed!).toBe(4);
      expect(total!).toBe(5);
    });
  });

  describe('clearLog()', () => {
    it('resets indent level so subsequent sections start fresh', () => {
      startSection('outer');
      startSection('inner');
      clearLog();
      startSection('new');
      log('x');
      const out = flushLog();
      const lines = out.split('\n');
      expect(lines[0]).toBe('new {');
      expect(lines[1]).toBe('  x');
    });
  });
});
