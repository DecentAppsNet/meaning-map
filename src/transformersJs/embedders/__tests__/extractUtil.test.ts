import { describe, it, expect } from 'vitest';
import { toRawVectorArray } from '../extractUtil';

export function _expectVectorsClose(
  actual: Iterable<number> | ArrayLike<number>,
  expected: Iterable<number> | ArrayLike<number>,
  places = 6
) {
  const a = Array.from(actual as Iterable<number>);
  const b = Array.from(expected as Iterable<number>);
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    // toBeCloseTo uses number of decimal places (default 2). We pass places.
    expect(a[i]).toBeCloseTo(b[i], places);
  }
}

describe('extractUtil', () => {
  describe('toRawVectorArray()', () => {

    it('returns the same array when passed a number[]', () => {
      const arr = [1, 2, 3];
      const out = toRawVectorArray(arr);
      _expectVectorsClose(out, [1, 2, 3]);
      expect(out).toBe(arr);
    });

    it('converts a Float32Array to a number[]', () => {
      const f = new Float32Array([1.5, 2.5, 3.5]);
      const out = toRawVectorArray(f);
      _expectVectorsClose(out, [1.5, 2.5, 3.5]);
    });

    it('extracts data when passed an object with data: Float32Array', () => {
      const obj = { data: new Float32Array([0.1, 0.2]) };
      const out = toRawVectorArray(obj as unknown);
      _expectVectorsClose(out, [0.1, 0.2], 6);
    });

    it('extracts data when passed an object with data: number[]', () => {
      const obj = { data: [7, 8, 9] };
      const out = toRawVectorArray(obj as unknown);
      _expectVectorsClose(out, [7, 8, 9]);
    });

    it('falls back to Array.from for other iterable typed arrays (e.g., Int8Array)', () => {
      const t = new Int8Array([4, 5, 6]);
      const out = toRawVectorArray(t as unknown);
      _expectVectorsClose(out, [4, 5, 6]);
    });

    it('throws for unexpected non-iterable shapes', () => {
      expect(() => toRawVectorArray(null as unknown)).toThrow(/Unexpected embedding output shape/);
    });
  });
});