import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import MeaningClassifications from '@/impexp/types/MeaningClassifications';
import { generateMeaningMapFromClassifications, matchMeaning, TestExports } from '../meaningMapUtil';
import { exampleClassifications } from './data/classificationsTestData';
import MeaningMap from '@/impexp/types/MeaningMap';
import MeaningMatch from '../types/MeaningMatch';
import { unreplaceWithPlaceholders } from '@/replacement/replaceUtil';

describe('meaningMapUtil', () => {
  describe('_generateWordUsageMap()', () => {
    it('returns empty map for no classifications', () => {
      const out = TestExports._generateWordUsageMap({});
      expect(out).toEqual({});
    });

    it('returns correct map for single classification with single utterance', () => {
      const classifications:MeaningClassifications = {
        '1': ['add to cart']
      };
      const out = TestExports._generateWordUsageMap(classifications);
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
      const out = TestExports._generateWordUsageMap(classifications);
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

  describe('_doMatchWordsMatchUtterance()', () => {
    it('matches a single word in single-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['hello'], 'hello')).toBe(true);
    });

    it('does not match a single word not present in single-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['foo'], 'bar')).toBe(false);
    });

    it('matches single word at beginning of multi-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['hello'], 'hello world')).toBe(true);
    });

    it('matches single word at end of multi-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['world'], 'hello world')).toBe(true);
    });

    it('matches single word in middle of multi-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['there'], 'hello there world')).toBe(true);
    });

    it('does not match single word not present in multi-word utterance', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['missing'], 'a b c')).toBe(false);
    });

    it('matches two adjacent match words', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['hello', 'world'], 'hello world')).toBe(true);
    });

    it('matches two match words with a gap between them', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['hello', 'world'], 'hello there world')).toBe(true);
    });

    it('does not match when only one of two match words is present', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['hello', 'missing'], 'hello world')).toBe(false);
    });

    it('does not match when two match words are present but out of sequence (adjacent)', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['world', 'hello'], 'hello world')).toBe(false);
    });

    it('does not match when two match words are present but out of sequence (with gap)', () => {
      expect(TestExports._doMatchWordsMatchUtterance(['world', 'hello'], 'hello there world')).toBe(false);
    });
  });

  describe('generateMeaningMapFromClassifications()', () => {
    let classifications:MeaningClassifications;

    beforeAll(() => {
      classifications = JSON.parse(JSON.stringify(exampleClassifications));
    });

    beforeEach(() => {
      expect(classifications).toEqual(exampleClassifications);
    });

    it('generates meaning map from populated classifications', () => {
      const meaningMap:MeaningMap = generateMeaningMapFromClassifications(classifications);
      const expected: MeaningMap = {
        why: [ { followingWords: [], meaningId: '0' } ],
        what: [ { followingWords: ['NUMBER'], meaningId: '0' } ],
        ITEMS: [
          { followingWords: ['NUMBER'], meaningId: '1' },
          { followingWords: ['ITEMS2'], meaningId: '1' }
        ],
        should: [ { followingWords: [], meaningId: '1.1' } ],
        need: [ { followingWords: [], meaningId: '1.1' } ]
      };
      expect(meaningMap).toEqual(expected);
    });
  });

  describe('matchMeaning()', () => {
    let meaningMap:MeaningMap, originalMeaningMap:MeaningMap;
    let classifications:MeaningClassifications;

    beforeAll(() => {
      classifications = JSON.parse(JSON.stringify(exampleClassifications));
      originalMeaningMap = generateMeaningMapFromClassifications(classifications);
      meaningMap = JSON.parse(JSON.stringify(originalMeaningMap));
    });

    beforeEach(() => {
      expect(meaningMap).toEqual(originalMeaningMap);
      expect(classifications).toEqual(exampleClassifications);
    });

    it('matches all utterances in classification to same meaning ID using meaning map', async () => {
      const meaningIds = Object.keys(classifications);
      for(let meaningIdI = 0; meaningIdI < meaningIds.length; ++meaningIdI) {
        const meaningId = meaningIds[meaningIdI];
        const utterances = classifications[meaningId];
        expect(utterances && utterances.length > 0);
        for (let utteranceI = 0; utteranceI < utterances.length; ++utteranceI) {
          const utterance = unreplaceWithPlaceholders(utterances[utteranceI]);
          const match:MeaningMatch|null = await matchMeaning(utterance, meaningMap);
          expect(match).not.toBeNull();
          expect(match!.meaningId).toEqual(meaningId);
        }
      }
    });
  });
});