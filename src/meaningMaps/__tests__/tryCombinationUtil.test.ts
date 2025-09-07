import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "../tryCombinationUtil";
import WordUsageMap, { duplicateWordUsageMap } from '../types/WordUsageMap';
import TryCombination from '../types/TryCombination';

// Use this one wordUsageMap for all tests. All words found in utterances
// passed to createFirstTryCombination() must be in this map.
const meaningIds = new Set(['0']);
const WORD_USAGE_MAP:WordUsageMap = {
  'brown':{usageCount:3, meaningIds},
  'dog':{usageCount:2, meaningIds},
  'fox':{usageCount:1, meaningIds},
  'hello':{usageCount:7, meaningIds},
  'jumped':{usageCount:4, meaningIds},
  'quick':{usageCount:4, meaningIds},
  'over':{usageCount:10, meaningIds},
  'the':{usageCount:50, meaningIds},
  'world':{usageCount:8, meaningIds},
}

describe('tryCombinationUtil', () => {
  let wordUsageMap:WordUsageMap;

  beforeAll(() => {
    wordUsageMap = duplicateWordUsageMap(WORD_USAGE_MAP);
  });

  beforeEach(() => {
    expect(wordUsageMap).toEqual(WORD_USAGE_MAP); // No mutations from tests.
  });

  describe('createFirstTryCombination()', () => {
    it('creates a combination for a one-word utterance', () => {
      const expected:TryCombination = {
        words:['hello'],
        wordIndexes:[0],
        wordEnablements:[true]
      };
      const combination = createFirstTryCombination('hello', wordUsageMap);
      expect(combination).toEqual(expected);
    });

    it('creates a combination for a two-word utterance where first world is less frequently used than second', () => {
      const expected:TryCombination = {
        words:['hello', 'world'],
        wordIndexes:[0,1],
        wordEnablements:[true, false]
      };
      const combination = createFirstTryCombination('hello world', wordUsageMap);
      expect(combination).toEqual(expected);
    });

    it('creates a combination for a two-word utterance where first world is more frequently used than second', () => {
      const expected:TryCombination = {
        words:['world', 'hello'],
        wordIndexes:[1,0],
        wordEnablements:[true, false]
      };
      const combination = createFirstTryCombination('world hello', wordUsageMap);
      expect(combination).toEqual(expected);
    });

    it('creates combination for an utterance with a parameter at beginning', () => {
      const expected:TryCombination = {
        words:['PARAM', 'hello', 'world'],
        wordIndexes:[1,2],
        wordEnablements:[false, false]
      };
      const combination = createFirstTryCombination('PARAM hello world', wordUsageMap);
      expect(combination).toEqual(expected);
    });

    it('creates combination for an utterance with a parameter at end', () => {
      const expected:TryCombination = {
        words:['hello', 'world', 'PARAM'],
        wordIndexes:[0,1],
        wordEnablements:[false, false]
      };
      const combination = createFirstTryCombination('hello world PARAM', wordUsageMap);
      expect(combination).toEqual(expected);
    });

    it('creates combination for an utterance with a parameter in middle', () => {
      const expected:TryCombination = {
        words:['hello', 'PARAM', 'world'],
        wordIndexes:[0,2],
        wordEnablements:[false, false]
      };
      const combination = createFirstTryCombination('hello PARAM world', wordUsageMap);
      expect(combination).toEqual(expected);
    });
  });

  describe('findNextTryCombination()', () => {
    function _nextAndConcat(combination:TryCombination|null, expectedMatchPhrase:string):TryCombination|null {
      expect(combination).not.toBeNull();
      const nextCombination = findNextTryCombination(combination!);
      if (!nextCombination) return null;
      const matchWords = concatMatchWords(nextCombination);
      const matchPhrase = matchWords.join(' ');
      expect(matchPhrase).toEqual(expectedMatchPhrase);
      return nextCombination;
    }

    it('iterates through all possible combinations of a phrase, by order of words used, and then usage count of individual words.', () => {
      let c:TryCombination|null = createFirstTryCombination('the quick brown fox', wordUsageMap);
      expect(concatMatchWords(c)).toEqual(['fox']);
      c = _nextAndConcat(c, 'brown');
      c = _nextAndConcat(c, 'quick');
      c = _nextAndConcat(c, 'the');
      c = _nextAndConcat(c, 'brown fox');
      c = _nextAndConcat(c, 'quick fox');
      c = _nextAndConcat(c, 'quick brown');
      c = _nextAndConcat(c, 'the fox');
      c = _nextAndConcat(c, 'the brown');
      c = _nextAndConcat(c, 'the quick');
      c = _nextAndConcat(c, 'quick brown fox');
      c = _nextAndConcat(c, 'the brown fox');
      c = _nextAndConcat(c, 'the quick fox');
      c = _nextAndConcat(c, 'the quick brown');
      c = _nextAndConcat(c, 'the quick brown fox');
      expect(findNextTryCombination(c!)).toBeNull();
    });

    it('iterates through all possible combinations of a phrase, retaining params in match words.', () => {
      let c:TryCombination|null = createFirstTryCombination('PARAM1 the quick PARAM2 brown fox PARAM3', wordUsageMap);
      expect(concatMatchWords(c)).toEqual(['PARAM1', 'PARAM2', 'PARAM3']);
      c = _nextAndConcat(c, 'PARAM1 PARAM2 fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 PARAM2 brown PARAM3');
      c = _nextAndConcat(c, 'PARAM1 quick PARAM2 PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the PARAM2 PARAM3');
      c = _nextAndConcat(c, 'PARAM1 PARAM2 brown fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 quick PARAM2 fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 quick PARAM2 brown PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the PARAM2 fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the PARAM2 brown PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the quick PARAM2 PARAM3');
      c = _nextAndConcat(c, 'PARAM1 quick PARAM2 brown fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the PARAM2 brown fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the quick PARAM2 fox PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the quick PARAM2 brown PARAM3');
      c = _nextAndConcat(c, 'PARAM1 the quick PARAM2 brown fox PARAM3');
      expect(findNextTryCombination(c!)).toBeNull();
    });
  });

  describe('concatMatchWords()', () => {
    it('returns correct match words for a one-word combination', () => {
      const combination:TryCombination = {
        words:['hello'],
        wordIndexes:[0],
        wordEnablements:[true]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['hello']);
    });

    it('returns correct match words for a two-word combination with both words enabled', () => {
      const combination:TryCombination = {
        words:['hello', 'world'],
        wordIndexes:[0,1],
        wordEnablements:[true, true]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['hello', 'world']);
    });

    it('returns correct match words for a two-word combination with one enabled word', () => {
      const combination:TryCombination = {
        words:['hello', 'world'],
        wordIndexes:[0,1],
        wordEnablements:[true, false]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['hello']);
    });

    it('returns correct match words when first enabled match word is more used than second enabled match word', () => {
      const combination:TryCombination = {
        words:['world', 'hello'],
        wordIndexes:[1,0],
        wordEnablements:[true, true]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['world', 'hello']);
    });

    it('returns param at beginning when no other words enabled', () => {
      const combination:TryCombination = {
        words:['PARAM', 'hello', 'world'],
        wordIndexes:[1,2],
        wordEnablements:[false]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['PARAM']);
    });

    it('returns param at end when no other words enabled', () => {
      const combination:TryCombination = {
        words:['hello', 'world', 'PARAM'],
        wordIndexes:[0,1],
        wordEnablements:[false, false]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['PARAM']);
    });

    it('returns param in middle when no other words enabled', () => {
      const combination:TryCombination = {
        words:['hello', 'PARAM', 'world'],
        wordIndexes:[0,2],
        wordEnablements:[false, false]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['PARAM']);
    });

    it('returns param along with an enabled word', () => {
      const combination:TryCombination = {
        words:['PARAM', 'hello', 'world'],
        wordIndexes:[1,2],
        wordEnablements:[false, true]
      };
      const matchWords = concatMatchWords(combination);
      expect(matchWords).toEqual(['PARAM', 'world']);
    });
  });
});
