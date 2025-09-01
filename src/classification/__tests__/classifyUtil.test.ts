import { describe, it, beforeEach, expect } from 'vitest';

import { exampleMeaningIndex } from './data/meaningIndexTestData';
import { TestExports, classifyUtterance } from '../classifyUtil';
import MeaningIndex from '@/impexp/types/MeaningIndex';

let originalWarn: (message?: any, ...optionalParams: any[]) => void;

function _disableConsoleWarn() {
  // Disable console.warn to keep test output clean
  originalWarn = console.warn;
  console.warn = () => {};
}

function _reenableConsoleWarn() {
  console.warn = originalWarn;
}

describe('classifyUtil', () => {
  let meaningIndex:MeaningIndex|null = null;

  beforeEach(() => {
    meaningIndex = JSON.parse(JSON.stringify(exampleMeaningIndex)); // deep copy
    expect(meaningIndex).toEqual(exampleMeaningIndex);
  });

  describe('_concatCandidateMeanings()', () => {
    it('concatenates a single candidate meaning', () => {
      const concat = TestExports._concatCandidateMeanings(['1'], meaningIndex!);
      expect(concat).toEqual('1 User declares or implies they are adding things to a container.');
    });

    it('concatenates multiple candidate meanings', () => {
      const concat = TestExports._concatCandidateMeanings(['1.1', '1.2', '1.3'], meaningIndex!);
      const lines = concat.split('\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('1 User declares or implies they are adding things to a container. They do not specify a NUMBER that would identify a container. They do not specify ITEMS to add to a container.');
      expect(lines[1]).toBe('2 User specifies ITEMS to add to a container. They do not specify a NUMBER that would identify a container.');
      expect(lines[2]).toBe('3 User specifies or implies they are adding something to a container. They specifiy a NUMBER that would identify a container. They do not specify ITEMS that they are adding.');
    });
  });

  describe('_combineMeaningNShotPairs()', () => {
    it('copies n-shot pairs for a single meaning', () => {
      const pairs = TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1']);
      expect(pairs.length).toBe(4);
      expect(pairs[0]).toEqual({ userMessage: "let's put some things in", assistantResponse: '1' });
      expect(pairs[1]).toEqual({ userMessage: 'adding', assistantResponse: '1' });
      expect(pairs[2]).toEqual({ userMessage: 'a im adding', assistantResponse: '1' });
      expect(pairs[3]).toEqual({ userMessage: "let's look at this", assistantResponse: '0' });
    });

    it('copies n-shot pairs for multiple meanings', () => {
      const pairs = TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
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
        _disableConsoleWarn();
        pairs = TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
      } finally {
        _reenableConsoleWarn();
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

    it('throws if meanings have different parent meaning IDs', () => {
      expect(() => {
        TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1', '1']);
      }).toThrow();
    });
  });

  const INFERENCE_TIMEOUT = 120000; // Terribly slow on first pass, but then it will be cached.
  describe('classifyUtterance()', () => {
    it('classifies an utterance to a meaning with an exact n-shot "Y" match', async () => {
      const meaningId = await classifyUtterance("i'm putting ITEMS inside", meaningIndex!);
      expect(meaningId).toBe('1.2');
    }, INFERENCE_TIMEOUT);

    it('classifies an utterance to a meaning without an exact n-shot "Y" match', async () => {
      const meaningId = await classifyUtterance("i got to add stuff", meaningIndex!);
      expect(meaningId).toBe('1.1');
    }, INFERENCE_TIMEOUT);
  });
});