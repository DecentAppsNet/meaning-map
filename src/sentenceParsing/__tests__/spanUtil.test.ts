import { describe, it, expect } from 'vitest';

import {combineAdjacentAndOverlappingTokenSpans} from '../spanUtil';

describe('spanUtil', () => {
  describe('combineAdjacentAndOverlappingTokenSpans()', () => {
    it('returns empty [] for []', () => {
      expect(combineAdjacentAndOverlappingTokenSpans([])).toEqual([]);
    });

    it('returns unchanged array for a single token span', () => {
      const spans = [{firstI:2, lastI:5}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual(spans);
    });

    it('returns unchanged array for two token spans separated by a token', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:7, lastI:9}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual(spans);
    });

    it('returns a single token span for two adjacent token spans', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:6, lastI:9}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:9}]);
    });

    it('returns a single token span for overlapping token spans', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:5, lastI:9}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:9}]);
    });

    it('returns a single token span for two identical token spans', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:2, lastI:5}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:5}]);
    });

    it('returns a single token span for a smaller token span that starts at the beginning of another', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:2, lastI:4}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:5}]);
    });

    it('returns a single token span for a smaller token span that starts at 0 inside of another larger span also starting at 0', () => {
      const spans = [{firstI:0, lastI:4}, {firstI:0, lastI:5}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:0, lastI:5}]);
    });

    it('returns a single token span for a smaller token span that ends at the end of another', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:3, lastI:5}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:5}]);
    });

    it('returns a single token span for a smaller token span that is fully contained within another', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:3, lastI:4}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:5}]);
    });
    
    it('combines multiple overlapping and adjacent token spans', () => {
      const spans = [{firstI:2, lastI:5}, {firstI:3, lastI:6}, {firstI:8, lastI:10}, {firstI:9, lastI:12}, {firstI:14, lastI:15}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:6}, {firstI:8, lastI:12}, {firstI:14, lastI:15}]);
    });

    it('combines multiple overlapping and adjacent token spans that are out of order', () => {
      const spans = [{firstI:14, lastI:15}, {firstI:2, lastI:5}, {firstI:9, lastI:12}, {firstI:3, lastI:6}, {firstI:8, lastI:10}];
      expect(combineAdjacentAndOverlappingTokenSpans(spans)).toEqual([{firstI:2, lastI:6}, {firstI:8, lastI:12}, {firstI:14, lastI:15}]);
    });
  });
});