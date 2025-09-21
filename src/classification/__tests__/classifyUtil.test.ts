import { describe, it, beforeEach, expect } from 'vitest';

import { exampleMeaningIndex } from './data/meaningIndexTestData';
import { exampleCorpus } from './data/corpusTestData';
import { classify, classifyUtterance } from '../classifyUtil';
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from '@/impexp/types/MeaningIndex';

import { flushLog, doesLogInclude } from '@/common/describeLog';
import MeaningClassifications from '@/impexp/types/MeaningClassifications';

describe('classifyUtil', () => {
  let meaningIndex:MeaningIndex|null = null;

  beforeEach(() => {
    meaningIndex = JSON.parse(JSON.stringify(exampleMeaningIndex)); // deep copy
    expect(meaningIndex).toEqual(exampleMeaningIndex);
  });

  const INFERENCE_TIMEOUT = 120000; // Terribly slow on first pass, but then inferences will be cached.
  describe('classifyUtterance()', () => {
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

    it(`directly compares utterances that could potentially match to more than one child.`, async () => {
      flushLog();
      await classifyUtterance("test: the kiwi is furry, prickly", meaningIndex!);
      expect(doesLogInclude('Directly comparing')).toEqual(true);
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
      if (DISPLAY_DESCRIBE_LOG) console.log(flushLog());
      expect(Object.keys(classifications).length).toBeGreaterThan(0);
      // I don't want to test that all the corpus classifications are as expected. The classifyUtterance()
      // tests will handle that in a more readable and maintainable way. This test is just making sure that
      // we can pump a bunch of utterances through and get them all classified.
    }, INFERENCE_TIMEOUT * 10); // Very slow on first pass, but then inferences will be cached.

    it('calls onUpdateClassification callback after each utterance classified', async () => {
      let updateCount = 0;
      await classify(corpus, meaningIndex!, (classifications) => {
        ++updateCount;
        expect(Object.keys(classifications).length).toBeGreaterThan(0);
      });
      expect(updateCount).toBe(corpus.length);
    }, INFERENCE_TIMEOUT * 10); // Very slow on first pass, but then inferences will be cached.
  });
});