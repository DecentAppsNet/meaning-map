import { describe, it, expect } from 'vitest';
import { numberToHex, hexToNumber } from '../hexUtil';

describe('hexUtil', () => {
  describe('numberToHex() and hexToNumber() symmetry', () => {
    function _roundTripHex(value:number):number {
      return hexToNumber(numberToHex(value));
    }

    it('round trips 0', () => {
      const value = 0;
      expect(_roundTripHex(value)).toEqual(value);
    });

    it('round trips a positive integer', () => {
      const value = 55;
      expect(_roundTripHex(value)).toEqual(value);
    });

    it('round trips a negative integer', () => {
      const value = -55;
      expect(_roundTripHex(value)).toEqual(value);
    });

    it('round trips Number.MIN_SAFE_INTEGER', () => {
      const value = Number.MIN_SAFE_INTEGER;
      expect(_roundTripHex(value)).toEqual(value);
    });

    it('round trips Number.MAX_SAFE_INTEGER', () => {
      const value = Number.MAX_SAFE_INTEGER;
      expect(_roundTripHex(value)).toEqual(value);
    });
  });

  describe('hexToNumber() error handling', () => {
    it('throws on empty string', () => {
      expect(() => hexToNumber('')).toThrow();
    });

    it('throws on non-hex characters', () => {
      expect(() => hexToNumber('xyz')).toThrow();
      expect(() => hexToNumber('123g')).toThrow();
      expect(() => hexToNumber('-123g')).toThrow();
      expect(() => hexToNumber('12.3')).toThrow();
    });

    it('throws on just a sign', () => {
      expect(() => hexToNumber('-')).toThrow();
      expect(() => hexToNumber('+')).toThrow();
    });

    it('throws on "-0"', () => {
      expect(() => hexToNumber('-0')).toThrow();
    });

    it('throws on hex number larger than Number.MAX_SAFE_INTEGER', () => {
      expect(() => hexToNumber('20000000000000')).toThrow();
    });

    it('throws on hex number smaller than Number.MIN_SAFE_INTEGER', () => { 
      expect(() => hexToNumber('-20000000000001')).toThrow();
    });

    it('throws on overly long string', () => {
      expect(() => hexToNumber('1234567890123456')).toThrow();
      expect(() => hexToNumber('-1234567890123456')).toThrow();
    });

    it('handles leading or trailing whitespace', () => {
      expect(hexToNumber(' 123')).toEqual(291);
      expect(hexToNumber('123 ')).toEqual(291);
      expect(hexToNumber('\n123')).toEqual(291);
      expect(hexToNumber('123\n')).toEqual(291);
    });

    it('throws on leading "0x"', () => {
      expect(() => hexToNumber('0x123')).toThrow();
      expect(() => hexToNumber('-0x123')).toThrow();
    });
  });
});