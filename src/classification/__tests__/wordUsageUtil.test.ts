import { describe, it, expect } from 'vitest';

import { generateWordUsageMap } from "../wordUsageUtil";
import MeaningClassifications from '@/impexp/types/MeaningClassifications';

describe('wordUsageUtil', () => {
  describe('_generateWordUsageMap()', () => {
    it('returns empty map for no classifications', () => {
      const out = generateWordUsageMap({});
      expect(out).toEqual({});
    });

    it('returns correct map for single classification with single utterance', () => {
      const classifications:MeaningClassifications = {
        '1': ['add to cart']
      };
      const out = generateWordUsageMap(classifications);
      expect(out).toEqual({
        add: { usageCount: 1, meaningIds: new Set(['1']) },
        to: { usageCount: 1, meaningIds: new Set(['1']) },
        cart: { usageCount: 1, meaningIds: new Set(['1']) }
      });
    });

    it('returns correct map for multiple classifications with multiple utterances', () => {
      const classifications:MeaningClassifications = {
        '1': ['add to cart', 'add items'],
        '2': ['remove from cart', 'delete items']
      };
      const out = generateWordUsageMap(classifications);
      expect(out).toEqual({
        add: { usageCount: 2, meaningIds: new Set(['1']) },
        to: { usageCount: 1, meaningIds: new Set(['1']) },
        cart: { usageCount: 2, meaningIds: new Set(['1', '2']) },
        items: { usageCount: 2, meaningIds: new Set(['1', '2']) },
        remove: { usageCount: 1, meaningIds: new Set(['2']) },
        from: { usageCount: 1, meaningIds: new Set(['2']) },
        delete: { usageCount: 1, meaningIds: new Set(['2']) }
      });
    });
  });
});