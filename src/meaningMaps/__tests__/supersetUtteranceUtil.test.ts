import { describe, it, expect } from 'vitest';
import { findAllSupersetUtterances } from '../supersetUtteranceUtil';
import MeaningClassifications from '@/impexp/types/MeaningClassifications';

describe('supersetUtteranceUtil', () => {
  describe('findAllSupersetUtterances()', () => {
    it('returns empty array when no supersets', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER']
      };
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual([]);
    });

    it('finds one superset utterance', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER'],
        '2.1': ['add ITEMS to NUMBER in the list']
      };
      const expected = ['add ITEMS to NUMBER in the list'];
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual(expected);
    });

    it('finds multiple superset utterances', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER'],
        '2.1': ['add ITEMS to NUMBER in the list', 'please add ITEMS to NUMBER in the list'],
        '3.1': ['add ITEMS to NUMBER now']
      };
      const expected = [
        'add ITEMS to NUMBER in the list', 
        'please add ITEMS to NUMBER in the list', 
        'add ITEMS to NUMBER now'
      ];
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual(expected);
    });
  });
});