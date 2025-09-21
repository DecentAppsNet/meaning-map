import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import { unreplaceWithPlaceholders } from "@/replacement/replaceUtil";
import MeaningMatch from "../types/MeaningMatch";
import { doMatchWordsMatchUtterance, matchMeaning } from "../matchUtil";
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

    it.skip('matches all utterances in classification to same meaning ID using meaning map', async () => {
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

  describe('doMatchWordsMatchUtterance()', () => {
    it('matches a single word in single-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['hello'], 'hello')).toBe(true);
    });

    it('does not match a single word not present in single-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['foo'], 'bar')).toBe(false);
    });

    it('matches single word at beginning of multi-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['hello'], 'hello world')).toBe(true);
    });

    it('matches single word at end of multi-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['world'], 'hello world')).toBe(true);
    });

    it('matches single word in middle of multi-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['there'], 'hello there world')).toBe(true);
    });

    it('does not match single word not present in multi-word utterance', () => {
      expect(doMatchWordsMatchUtterance(['missing'], 'a b c')).toBe(false);
    });

    it('matches two adjacent match words', () => {
      expect(doMatchWordsMatchUtterance(['hello', 'world'], 'hello world')).toBe(true);
    });

    it('matches two match words with a gap between them', () => {
      expect(doMatchWordsMatchUtterance(['hello', 'world'], 'hello there world')).toBe(true);
    });

    it('does not match when only one of two match words is present', () => {
      expect(doMatchWordsMatchUtterance(['hello', 'missing'], 'hello world')).toBe(false);
    });

    it('does not match when two match words are present but out of sequence (adjacent)', () => {
      expect(doMatchWordsMatchUtterance(['world', 'hello'], 'hello world')).toBe(false);
    });

    it('does not match when two match words are present but out of sequence (with gap)', () => {
      expect(doMatchWordsMatchUtterance(['world', 'hello'], 'hello there world')).toBe(false);
    });
  });
});