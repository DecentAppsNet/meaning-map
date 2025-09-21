import { describe, it, expect, beforeEach } from 'vitest';
import { exampleMeaningIndex } from './data/meaningIndexTestData';
import { disableConsoleWarn, reenableConsoleWarn } from '@/common/testUtil';
import MeaningIndex from '@/impexp/types/MeaningIndex';
import { combineMeaningNShotPairs } from '../nShotUtil';

describe('nShotUtil', () => {
  let meaningIndex:MeaningIndex|null = null;

  beforeEach(() => {
    meaningIndex = JSON.parse(JSON.stringify(exampleMeaningIndex)); // deep copy
    expect(meaningIndex).toEqual(exampleMeaningIndex);
  });
  
  describe('combineMeaningNShotPairs()', () => {
    it('copies n-shot pairs for a single meaning', () => {
      const pairs = combineMeaningNShotPairs(meaningIndex!, ['1.1']);
      expect(pairs.length).toBe(4);
      expect(pairs[0]).toEqual({ userMessage: "let's put some things in", assistantResponse: '1' });
      expect(pairs[1]).toEqual({ userMessage: 'adding', assistantResponse: '1' });
      expect(pairs[2]).toEqual({ userMessage: 'a im adding', assistantResponse: '1' });
      expect(pairs[3]).toEqual({ userMessage: "let's look at this", assistantResponse: '0' });
    });

    it('copies n-shot pairs for multiple meanings', () => {
      const pairs = combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
      expect(pairs.length).toBe(10);
      expect(pairs[0]).toEqual({ userMessage: "let's put some things in", assistantResponse: '1' });
      expect(pairs[1]).toEqual({ userMessage: 'adding', assistantResponse: '1' });
      expect(pairs[2]).toEqual({ userMessage: 'a im adding', assistantResponse: '1' });
      expect(pairs[3]).toEqual({ userMessage: 'add ITEMS', assistantResponse: '2' });
      expect(pairs[4]).toEqual({ userMessage: "i'm putting ITEMS inside", assistantResponse: '2' });
      expect(pairs[5]).toEqual({ userMessage: 'ITEMS go here', assistantResponse: '2' });
      expect(pairs[6]).toEqual({ userMessage: "i'm putting it inside NUMBER", assistantResponse: '3' });
      expect(pairs[7]).toEqual({ userMessage: "let's put these in NUMBER", assistantResponse: '3' });
      expect(pairs[8]).toEqual({ userMessage: 'adding to NUMBER', assistantResponse: '3' });
      expect(pairs[9]).toEqual({ userMessage: "let's look at this", assistantResponse: '0' });
    });

    it('does not add "Y" n-shot pairs that are present in multiple meanings more than once', () => {
      // Add a duplicate "Y" pair to meanings
      meaningIndex!['1.1'].nShotPairs.push({ userMessage: 'duplicate Y', assistantResponse: 'Y' });
      meaningIndex!['1.2'].nShotPairs.push({ userMessage: 'duplicate Y', assistantResponse: 'Y' });
      meaningIndex!['1.3'].nShotPairs.push({ userMessage: 'duplicate Y', assistantResponse: 'Y' });
      let pairs;
      try {
        disableConsoleWarn();
        pairs = combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
      } finally {
        reenableConsoleWarn();
      }
      expect(pairs.length).toBe(10);
      expect(pairs[0]).toEqual({ userMessage: "let's put some things in", assistantResponse: '1' });
      expect(pairs[1]).toEqual({ userMessage: 'adding', assistantResponse: '1' });
      expect(pairs[2]).toEqual({ userMessage: 'a im adding', assistantResponse: '1' });
      expect(pairs[3]).toEqual({ userMessage: 'add ITEMS', assistantResponse: '2' });
      expect(pairs[4]).toEqual({ userMessage: "i'm putting ITEMS inside", assistantResponse: '2' });
      expect(pairs[5]).toEqual({ userMessage: 'ITEMS go here', assistantResponse: '2' });
      expect(pairs[6]).toEqual({ userMessage: "i'm putting it inside NUMBER", assistantResponse: '3' });
      expect(pairs[7]).toEqual({ userMessage: "let's put these in NUMBER", assistantResponse: '3' });
      expect(pairs[8]).toEqual({ userMessage: 'adding to NUMBER', assistantResponse: '3' });
      expect(pairs[9]).toEqual({ userMessage: "let's look at this", assistantResponse: '0' });
    });

    it('does not add n-shot pair that would be duplicate', () => {
      meaningIndex!['1.1'].nShotPairs.push({ userMessage: `let's put some things in`, assistantResponse: 'Y' });
      let pairs;
      try {
        disableConsoleWarn();
        pairs = combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
      } finally {
        reenableConsoleWarn();
      }
      expect(pairs.length).toBe(10);
      expect(pairs[0]).toEqual({ userMessage: "let's put some things in", assistantResponse: '1' });
    });

    it('combines n-shot pairs for root parent', () => {
      const pairs = combineMeaningNShotPairs(meaningIndex!, ['1']);
      const expected = [
        { userMessage: 'adding to bin', assistantResponse: '1' },
        { userMessage: "let's put some stuff in", assistantResponse: '1' },
        { userMessage: 'add ITEMS to NUMBER', assistantResponse: '1' },
        { userMessage: "i'm putting ITEMS inside", assistantResponse: '1' },
        { userMessage: "let's put ITEMS in NUMBER", assistantResponse: '1' },
        { userMessage: 'i have NUMBER adding ITEMS', assistantResponse: '1' },
        { userMessage: 'adding ITEMS its NUMBER i better stop', assistantResponse: '1' },
        { userMessage: 'uh i want i want to put these in', assistantResponse: '1' },
        { userMessage: 'uh', assistantResponse: '0' },
        { userMessage: 'a', assistantResponse: '0' },
        { userMessage: "i'm busy packing can we talk later", assistantResponse: '0' },
        { userMessage: "tell her i'll come downstairs", assistantResponse: '0' },
        { userMessage: 'i need to hurry', assistantResponse: '0' },
        { userMessage: 'what was i doing', assistantResponse: '0' }
      ];
      expect(pairs).toEqual(expected);
    });

    it('throws if meanings have different parent meaning IDs', () => {
      expect(() => {
        combineMeaningNShotPairs(meaningIndex!, ['1.1', '1']);
      }).toThrow();
    });
  });
});