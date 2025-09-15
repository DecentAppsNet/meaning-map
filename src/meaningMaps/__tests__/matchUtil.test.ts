import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import { unreplaceWithPlaceholders } from "@/replacement/replaceUtil";
import MeaningMatch from "../types/MeaningMatch";
import { matchMeaning } from "../matchUtil";
import { exampleClassifications } from "./data/classificationsTestData";
import { generateMeaningMapFromClassifications } from "../meaningMapUtil";
import MeaningClassifications, { duplicateMeaningClassifications } from "@/impexp/types/MeaningClassifications";
import MeaningMap, { duplicateMeaningMap } from "@/impexp/types/MeaningMap";

describe('matchUtil', () => {
  describe('matchMeaning()', () => {
    let meaningMap:MeaningMap, originalMeaningMap:MeaningMap;
    let classifications:MeaningClassifications;

    beforeAll(() => {
      classifications = duplicateMeaningClassifications(exampleClassifications);
      originalMeaningMap = generateMeaningMapFromClassifications(classifications);
      meaningMap = duplicateMeaningMap(originalMeaningMap);
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

    it('handles an utterance that has less words than one of the match rules', async () => {
      const meaningMap2 = duplicateMeaningMap(meaningMap);
      meaningMap2['when'] = [ { followingWords: ['are', 'you', 'happy'], meaningId: '0' } ];
      const match = await matchMeaning('when', meaningMap2);
      expect(match).toBeNull();
    });
  });
});