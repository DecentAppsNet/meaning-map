import { describe, it, expect } from 'vitest';
import * as describeLog from '../describeLog';
import { disableConsoleError, reenableConsoleError } from '@/common/testUtil';

describe('describeLog', () => {
  it('logs messages and returns joined string on flush', () => {
    // start with a clean state
    describeLog.flush();
    describeLog.log('first');
    describeLog.log('second');
    const out = describeLog.flush();
    expect(out).toBe('first\nsecond');
    // flush should clear the log
    const out2 = describeLog.flush();
    expect(out2).toBe('');
  });

  it('respects startSection and endSection for indentation (non-nested)', () => {
    describeLog.flush();
    describeLog.log('a');
    describeLog.startSection('section1');
    describeLog.log('b');
    // end section and then log at top-level
    describeLog.endSection();
    describeLog.log('c');

    const out = describeLog.flush();
    const lines = out.split('\n');
    expect(lines[0]).toBe('a');
    expect(lines[1]).toBe('section1 {');
    expect(lines[2]).toBe('  b');
    expect(lines[3]).toBe('}');
    expect(lines[4]).toBe('c');
  });

  it('allows endSection to be called with no active section (no throw)', () => {
    describeLog.flush();
    disableConsoleError();
    try {
      expect(() => describeLog.endSection()).not.toThrow();
    } finally {
      reenableConsoleError();
    }
    // flush should still work and reset internal state
    expect(describeLog.flush()).toBe('}');
  });
});
