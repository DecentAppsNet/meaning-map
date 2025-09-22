import { describe, it, expect } from 'vitest';

import { duplicateMeaningMapRule, areMeaningMapRulesEqual } from '../MeaningMapRule';
import type MeaningMapRule from '../MeaningMapRule';

describe('MeaningMapRule types', () => {
  describe('duplicateMeaningMapRule()', () => {
    it('creates a deep copy of the rule including tieBreakIds', () => {
      const original: MeaningMapRule = { followingWords: ['ITEMS', 'to'], meaningId: '1.2', tieBreakIds: [10, 20] } as any;
      const copy = duplicateMeaningMapRule(original);

      // Structural equality
      expect(copy).toEqual(original);

      // Mutating the copy does not affect the original (deep copy behavior)
      copy.followingWords[0] = 'CHANGED';
      if (copy.tieBreakIds) copy.tieBreakIds[0] = 99;
      expect(original.followingWords[0]).toBe('ITEMS');
      expect(original.tieBreakIds?.[0]).toBe(10);
    });
  });

  describe('areMeaningMapRulesEqual()', () => {
    it('returns true for identical rules (including undefined tieBreakIds)', () => {
      const a: MeaningMapRule = { followingWords: [], meaningId: 'root' } as any;
      const b: MeaningMapRule = { followingWords: [], meaningId: 'root' } as any;
      expect(areMeaningMapRulesEqual(a, b)).toBe(true);
    });

    it('returns false when meaningId differs', () => {
      const a: MeaningMapRule = { followingWords: ['x'], meaningId: '1' } as any;
      const b: MeaningMapRule = { followingWords: ['x'], meaningId: '2' } as any;
      expect(areMeaningMapRulesEqual(a, b)).toBe(false);
    });

    it('returns false when followingWords length or content differs', () => {
      const a: MeaningMapRule = { followingWords: ['a', 'b'], meaningId: '1' } as any;
      const b: MeaningMapRule = { followingWords: ['a'], meaningId: '1' } as any;
      const c: MeaningMapRule = { followingWords: ['x', 'b'], meaningId: '1' } as any;
      expect(areMeaningMapRulesEqual(a, b)).toBe(false);
      expect(areMeaningMapRulesEqual(a, c)).toBe(false);
    });

    it('compares tieBreakIds for exact match (order and values)', () => {
      const a: MeaningMapRule = { followingWords: ['z'], meaningId: '1', tieBreakIds: [1, 2] } as any;
      const b: MeaningMapRule = { followingWords: ['z'], meaningId: '1', tieBreakIds: [1, 2] } as any;
      const c: MeaningMapRule = { followingWords: ['z'], meaningId: '1', tieBreakIds: [2, 1] } as any;
      const d: MeaningMapRule = { followingWords: ['z'], meaningId: '1', tieBreakIds: [1] } as any;
      const e: MeaningMapRule = { followingWords: ['z'], meaningId: '1' } as any;
      expect(areMeaningMapRulesEqual(a, b)).toBe(true);
      expect(areMeaningMapRulesEqual(a, c)).toBe(false);
      expect(areMeaningMapRulesEqual(a, d)).toBe(false);
      expect(areMeaningMapRulesEqual(a, e)).toBe(false);
      expect(areMeaningMapRulesEqual(e, a)).toBe(false);
    });

    it('returns true for a rule and its duplicate produced by duplicateMeaningMapRule', () => {
      const original: MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1.1', tieBreakIds: [5] } as any;
      const copy = duplicateMeaningMapRule(original);
      expect(areMeaningMapRulesEqual(original, copy)).toBe(true);
    });
  });
});
