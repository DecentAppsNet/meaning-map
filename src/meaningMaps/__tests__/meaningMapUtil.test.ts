import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import exampleMeaningMapText from './data/exampleMeaningMap';
import { loadMeaningMap } from '@/impexp/meaningMapImporter';
import MeaningMap, { duplicateMeaningMap } from '../types/MeaningMap';
import { matchMeaning } from '../meaningMapUtil';
import { initEmbedder, isEmbedderInitialized } from '@/transformersJs/transformersEmbedder';

describe('meaningMapUtil', () => {
  let originalMeaningMap:MeaningMap;
  let meaningMap:MeaningMap;

  beforeAll(async () => {
    if (!isEmbedderInitialized()) await initEmbedder();
    originalMeaningMap = await loadMeaningMap(exampleMeaningMapText);
  }, 120000);

  beforeEach(() => {
    meaningMap = duplicateMeaningMap(originalMeaningMap);
  });

  describe('matchMeaning()', () => {
    it('matches a simple utterance', async () => {
      const match = await matchMeaning('i want to add this', meaningMap);
      expect(match).toEqual({ meaningId:meaningMap.ids.adding_only, paramValues:{} });
    });

    it('returns null for non-matching utterance', async () => {
      const match = await matchMeaning('this does not match', meaningMap);
      expect(match).toBeNull();
    });
  });
});