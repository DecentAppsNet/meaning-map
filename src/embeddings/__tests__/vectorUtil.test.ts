import { describe, it, expect } from 'vitest';
import {
  compareUnitVectors,
  createUnitVector,
  subtractUnitVectors,
  averageUnitVectors,
  removeProjectionFromUnitVector,
  unitVectorToBytes,
  bytesToUnitVector,
} from '../vectorUtil';

function _magnitude(v: ArrayLike<number>) {
  return Math.sqrt(Array.from(v).reduce((s, x) => s + x * x, 0));
}

describe('vectorUtil', () => {
  describe('compareUnitVectors()', () => {
    it('returns 1 for identical unit vectors', () => {
      const a = createUnitVector([1, 0]);
      const b = createUnitVector([1, 0]);
      expect(compareUnitVectors(a, b)).toBeCloseTo(1, 6);
    });

    it('returns -1 for opposite unit vectors', () => {
      const a = createUnitVector([1, 0]);
      const b = createUnitVector([-1, 0]);
      expect(compareUnitVectors(a, b)).toBeCloseTo(-1, 6);
    });
  });

  describe('createUnitVector()', () => {
    it('normalizes a simple vector to unit length', () => {
      const u = createUnitVector([3, 4]);
      expect(_magnitude(u)).toBeCloseTo(1, 6);
      expect(u[0]).toBeGreaterThan(0);
      expect(u[1]).toBeGreaterThan(0);
    });

    it('throws when given an empty vector', () => {
      expect(() => createUnitVector([] as any)).toThrow();
    });

    it('throws when magnitude too small to normalize', () => {
      expect(() => createUnitVector([1e-12, 0] as any)).toThrow();
    });
  });

  describe('subtractUnitVectors()', () => {
    it('returns a unit vector representing the (normalized) difference of orthogonal unit vectors', () => {
      const a = createUnitVector([1, 0]);
      const b = createUnitVector([0, 1]);
      const out = subtractUnitVectors(a, b);
      expect(_magnitude(out)).toBeCloseTo(1, 6);
      expect(out[0]).toBeGreaterThan(0);
      expect(out[1]).toBeLessThan(0);
    });

    it('throws when vectors are identical (no direction)', () => {
      const a = createUnitVector([1, 0]);
      expect(() => subtractUnitVectors(a, a)).toThrow();
    });
  });

  describe('averageUnitVectors()', () => {
    it('averages identical unit vectors to the same direction', () => {
      const a = createUnitVector([1, 0]);
      const avg = averageUnitVectors([a, a]);
      expect(_magnitude(avg)).toBeCloseTo(1, 6);
      expect(avg[0]).toBeGreaterThan(0.9);
    });

    it('throws when averaging opposite vectors yields zero magnitude', () => {
      const a = createUnitVector([1, 0]);
      const b = createUnitVector([-1, 0]);
      expect(() => averageUnitVectors([a, b])).toThrow();
    });
  });

  describe('removeProjectionFromUnitVector()', () => {
    it('removes projection onto orthogonal vector and preserves magnitude ~1', () => {
      const v = createUnitVector([1, 0]);
      const proj = createUnitVector([0, 1]);
      const out = removeProjectionFromUnitVector(v, proj);
      expect(_magnitude(out)).toBeCloseTo(1, 6);
      expect(out[0]).toBeGreaterThan(0.9);
    });

    it('throws when removing projection of a vector onto itself (zero result)', () => {
      const v = createUnitVector([1, 0]);
      expect(() => removeProjectionFromUnitVector(v, v)).toThrow();
    });
  });

  describe('unitVectorToBytes() and bytesToUnitVector()', () => {
    it('round-trips a unit vector through bytes', () => {
      const original = createUnitVector(new Float32Array([1, 2, 3]));
      const bytes = unitVectorToBytes(original);
      expect(bytes.length).toBe(original.length * 4);
      const roundTripped = bytesToUnitVector(bytes);
      expect(compareUnitVectors(original, roundTripped)).toBeCloseTo(1, 3);
    });
  });
});
