import { describe, it, beforeEach, expect } from 'vitest';

import { exampleMeaningIndex } from './data/meaningIndexTestData';
import { exampleCorpus } from './data/corpusTestData';
import { TestExports, classify, classifyUtterance } from '../classifyUtil';
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from '@/impexp/types/MeaningIndex';
import { disableConsoleWarn, reenableConsoleWarn } from '@/common/testUtil';
import { flush, includes, log } from '@/common/describeLog';
import MeaningClassifications from '@/impexp/types/MeaningClassifications';

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
      expect(lines[0]).toBe(`1 User doesn't specify the "NUMBER" keyword or, if specified, it isn't used as a destination for adding. User doesn't specify the "ITEMS" keyword.`);
      expect(lines[1]).toBe(`2 User specifies "ITEMS" keyword to represent items to add to a container. User doesn't specify the "NUMBER" keyword or, if specified, it isn't used as a destination for adding.`);
      expect(lines[2]).toBe(`3 User specifies "NUMBER" keyword to represent a destination for adding items. User doesn't specify the "ITEMS" keyword.`);
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
        disableConsoleWarn();
        pairs = TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1', '1.2', '1.3']);
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

    it('throws if meanings have different parent meaning IDs', () => {
      expect(() => {
        TestExports._combineMeaningNShotPairs(meaningIndex!, ['1.1', '1']);
      }).toThrow();
    });
  });

  describe('_makeReplacements()', () => {
    it('replaces items', async () => {
      const s = "i'm putting an apple inside";
      const out = await TestExports._makeReplacements(s);
      expect(out).toBe("i'm putting ITEMS inside");
    });
  });

  const INFERENCE_TIMEOUT = 120000; // Terribly slow on first pass, but then it will be cached.
  describe('classifyUtterance()', () => {
    /*
    Tests - use nShotPairs as needed to avoid non-deterministic LLM responses.

    returns unclassified for an empty string

    returns unclassified for an utterance that doesn't match top-level meanings

    returns unclassified for an utterance that matches #0 n-shot pair with "Y".

    returns top-level ID for an utterance that matches the top-level, but not children.



    */
    it('returns unclassified for an empty string', async () => {
      const meaningId = await classifyUtterance("", meaningIndex!);
      expect(meaningId).toBe(UNCLASSIFIED_MEANING_ID);
    }, INFERENCE_TIMEOUT);

    it(`returns unclassified for an utterance that doesn't match top-level meanings`, async () => {
      const meaningId = await classifyUtterance("x97sdfs213", meaningIndex!);
      expect(meaningId).toBe(UNCLASSIFIED_MEANING_ID);
    }, INFERENCE_TIMEOUT);

    it(`returns unclassified for an utterance that matches #0 n-shot pair with "Y".`, async () => {
      const meaningId = await classifyUtterance("uh", meaningIndex!);
      expect(meaningId).toBe(UNCLASSIFIED_MEANING_ID);
    }, INFERENCE_TIMEOUT);

    it(`returns top-level ID for an utterance that matches the top-level, but not children.`, async () => {
      const meaningId = await classifyUtterance("test: hmm", meaningIndex!);
      expect(meaningId).toBe("999");
    }, INFERENCE_TIMEOUT);
    
    it(`returns ID for an utterance that matches non-top-level meaning.`, async () => {
      const meaningId = await classifyUtterance("test: i always like to pet dogs", meaningIndex!);
      expect(meaningId).toBe("999.1.2");
    }, INFERENCE_TIMEOUT);

    it(`returns ID for an utterance that could potentially match to more than one child.`, async () => {
      flush();
      await classifyUtterance("test: the kiwi is furry, prickly", meaningIndex!);
      expect(includes('Directly comparing')).toEqual(true);
      // I don't care what the meaning ID is because that's a non-deterministic LLM response.
    }, INFERENCE_TIMEOUT);
  });

  describe('classify()', () => {
    let corpus:string[];

    beforeEach(async () => {
      corpus = [...exampleCorpus];
      expect(corpus).toEqual(exampleCorpus);
    });

    it('returns empty classification for empty corpus', async () => {
      const classifications:MeaningClassifications = await classify([], meaningIndex!);
      expect(classifications).toEqual({});
    });

    const DISPLAY_DESCRIBE_LOG = false;
    it('classifies multiple utterances', async () => {
      const classifications:MeaningClassifications = await classify(corpus, meaningIndex!);
      if (DISPLAY_DESCRIBE_LOG) flush();
      expect(Object.keys(classifications).length).toBeGreaterThan(0);
      // I don't want to test that all the corpus classifications are as expected. The classifyUtterance()
      // tests will handle that in a more readable and maintainable way. This test is just making sure that
      // we can pump a bunch of utterances through and get them all classified.
    }, INFERENCE_TIMEOUT * 10); // Very slow on first pass, but then it will be cached.
  });
});