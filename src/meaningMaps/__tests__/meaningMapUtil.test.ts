import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import exampleMeaningMapText from './data/exampleMeaningMap';
import { loadMeaningMap } from '@/impexp/meaningMapImporter';
import MeaningMap, { duplicateMeaningMap } from '../types/MeaningMap';
import { matchMeaning, matchMeaningWithStats } from '../meaningMapUtil';
import { initEmbedder, isEmbedderInitialized } from '@/transformersJs/transformersEmbedder';
import MeaningMatchStats from '../types/MeaningMatchStats';
import MeaningMatchNodeStats from '../types/MeaningMatchNodeStats';

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
    it('matches an utterance', async () => {
      const match = await matchMeaning('i want to add this', meaningMap);
      expect(match).toEqual({ meaningId:meaningMap.ids.adding_only, paramValues:{} });
    });

    it('returns null for non-matching utterance', async () => {
      const match = await matchMeaning('this does not match', meaningMap);
      expect(match).toBeNull();
    });

    it('avoids matching an utterance that is missing a required param', async () => {
      const dilemmaMap = await loadMeaningMap(`# loves ITEMS >0\ni love ITEMS\n# hates things >0\ni hate this`);
      const match = await matchMeaning('i love this', dilemmaMap); // intentionally chosen as close in meaning to first option, though lacking ITEMS param.
      expect(match!.meaningId).toEqual(dilemmaMap.ids.hates_things);
    });

    it('throws if utterance is not in plain format', async () => {
      await expect(matchMeaning('Hello World', meaningMap)).rejects.toThrow();
    });
  });

  describe('matchMeaningWithStats()', () => {
    it('returns stats for matching an utterance', async () => {
      const match = await matchMeaningWithStats('i want to add this', meaningMap);
      const stats = match?.stats as MeaningMatchStats;;
      expect(stats.comparisonCount).toBeGreaterThan(0);
      expect(stats.matchMSecs).toBeGreaterThan(0);
      expect(Object.keys(stats.nodeStats).length).toEqual(2);
      const rootStats = stats.nodeStats[0] as MeaningMatchNodeStats;
      expect(rootStats.id).toEqual(0);
      expect(rootStats.childMatchScore).toBeGreaterThan(0);
      expect(rootStats.childMatchSeparation).toBeGreaterThan(0);
      const addingStats = stats.nodeStats[1] as MeaningMatchNodeStats;
      expect(addingStats.id).toEqual(1);
      expect(addingStats.childMatchScore).toBeGreaterThan(0);
      expect(addingStats.childMatchSeparation).toBeGreaterThan(0);
      expect(match).toEqual({ meaningId:meaningMap.ids.adding_only, paramValues:{}, stats });
    });

    it('returns null for non-matching utterance', async () => {
      const match = await matchMeaningWithStats('this does not match', meaningMap);
      expect(match).toBeNull();
    });

    it('throws if utterance is not in plain format', async () => {
      await expect(matchMeaningWithStats('Hello World', meaningMap)).rejects.toThrow();
    });
  });
});