import { describe, it, expect, beforeEach } from 'vitest';
import { createSubsetIndex, addTrumpsForSubsetsAndSupersets } from '../supersetUtil';
import MeaningClassifications from '@/impexp/types/MeaningClassifications';
import MeaningMap, { duplicateMeaningMap } from '@/impexp/types/MeaningMap';
import SubsetIndex from '../types/SubsetIndex';

describe('supersetUtil', () => {
  describe('createSubsetIndex()', () => {
    it('returns empty subset index for empty classifications', () => {
      const classifications = {};
      const subsetIndex = createSubsetIndex(classifications);
      expect(subsetIndex).toEqual({});
    });

    it('returns empty subset index when no utterances are subsets', () => {
      const classifications:MeaningClassifications = {
        '1': ['hello world', 'goodbye world'],
        '2': ['foo bar', 'bar baz']
      };
      const subsetIndex = createSubsetIndex(classifications);
      expect(subsetIndex).toEqual({});
    });

    it('identifies subsets and their supersets correctly', () => {
      const classifications:MeaningClassifications = {
        '1': ['i love you', 'you are great'],
        '2': ['i really love you', 'you are really great'],
        '3': ['hello there']
      };
      const subsetIndex = createSubsetIndex(classifications);
      expect(Object.keys(subsetIndex).length).toBe(2);
      expect(subsetIndex['i love you'].supersetUtterances).toEqual(['i really love you']);
      expect(subsetIndex['you are great'].supersetUtterances).toEqual(['you are really great']);
    });

    it('handles multiple subsets with shared supersets', () => {
      const classifications:MeaningClassifications = {
        '1': ['quick brown fox', 'lazy dog'],
        '2': ['the quick brown fox jumps', 'the lazy dog sleeps'],
        '3': ['the fox jumps']
      };
      const subsetIndex = createSubsetIndex(classifications);
      expect(Object.keys(subsetIndex).length).toBe(3);
      expect(subsetIndex['quick brown fox'].supersetUtterances).toEqual(['the quick brown fox jumps']);
      expect(subsetIndex['the fox jumps'].supersetUtterances).toEqual(['the quick brown fox jumps']);
      expect(subsetIndex['lazy dog'].supersetUtterances).toEqual(['the lazy dog sleeps']);
    });

    it('handles subset with multiple supersets', () => {
      const classifications:MeaningClassifications = {
        '1': ['cat'],
        '2': ['the cat sits', 'a cat sleeps'],
        '3': ['the cat sleeps on the mat']
      };
      const subsetIndex = createSubsetIndex(classifications);
      expect(Object.keys(subsetIndex).length).toBe(1);
      expect(subsetIndex['cat'].supersetUtterances.sort()).toEqual(['the cat sits', 'a cat sleeps', 'the cat sleeps on the mat'].sort());
    });

    it('does not consider utterances within the same meaning ID as supersets', () => {
      const classifications:MeaningClassifications = {
        '1': ['i love you', 'i really love you'],
        '2': ['you are great', 'you are really great']
      };
      const subsetIndex = createSubsetIndex(classifications);
      expect(Object.keys(subsetIndex).length).toBe(0);
    });
  });

  describe('addTrumpsForSubsetsAndSupersets()', () => {
    const originalMeaningMap:MeaningMap = {
      'the':[
        {followingWords:['brown','fox'],meaningId:'1'},
        {followingWords:['quick','fox'],meaningId:'2'},
        {followingWords:['amazing','brown','fox'],meaningId:'3'}
      ]
    };
    let meaningMap:MeaningMap;

    beforeEach(() => {
      meaningMap = duplicateMeaningMap(originalMeaningMap);
    });

    it('makes no changes to meaning map for an empty subset index', () => {
      const subsetIndex:SubsetIndex = {};
      const utteranceToRuleReferenceMap = {};
      addTrumpsForSubsetsAndSupersets(subsetIndex, utteranceToRuleReferenceMap);
      expect(meaningMap).toEqual(originalMeaningMap);
    });

    it('adds trump ID to subset and superset-generated rules', () => {
      const utteranceToRuleReferenceMap = {
        'the quick fox': { firstWord: 'the', rule: meaningMap.the[1] },
        'the quick brown fox': { firstWord: 'the', rule: meaningMap.the[0] }
      };
      const subsetIndex:SubsetIndex = {
        'the quick fox':{
          utterance:'the quick fox',
          supersetUtterances: ['the quick brown fox']
        }
      }
      addTrumpsForSubsetsAndSupersets(subsetIndex, utteranceToRuleReferenceMap);
      expect(meaningMap.the[0].trumpIds).toEqual([1]);
      expect(meaningMap.the[1].trumpIds).toEqual([-1]);
    });

    it('does not add trump IDs when subset and superset have different number of match words', () => {
      const utteranceToRuleReferenceMap = {
        'the brown fox': { firstWord: 'the', rule: meaningMap.the[0] },
        'the amazing brown fox': { firstWord: 'the', rule: meaningMap.the[2] }
      };
      const subsetIndex:SubsetIndex = {
        'the brown fox':{
          utterance:'the brown fox',
          supersetUtterances: ['the amazing brown fox']
        }
      }
      addTrumpsForSubsetsAndSupersets(subsetIndex, utteranceToRuleReferenceMap);
      expect(meaningMap).toEqual(originalMeaningMap);
    });
  });
  
});