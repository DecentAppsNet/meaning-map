import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import { doMatchWordsMatchUtterance, matchMeaning } from "../matchUtil";
import { exampleClassifications } from "./data/classificationsTestData";
import { doesMeaningMapCorrectlyMatchClassifications, generateMeaningMapFromClassifications } from "../meaningMapUtilOld";
import MeaningClassifications, { duplicateMeaningClassifications } from "@/impexp/types/MeaningClassifications";
import MeaningMap, { duplicateMeaningMap } from "@/impexp/types/MeaningMapOld";
import { flushLog } from '@/common/describeLog';

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
      flushLog();
      const result = await doesMeaningMapCorrectlyMatchClassifications(meaningMap, classifications);
      if (!result) console.log(flushLog());
      expect(result).toBe(true);
    });

    it('handles an utterance that has less words than one of the match rules', async () => {
      const meaningMap2 = duplicateMeaningMap(meaningMap);
      meaningMap2['when'] = [ { followingWords: ['are', 'you', 'happy'], meaningId: '0' } ];
      const match = await matchMeaning('when', meaningMap2);
      expect(match).toBeNull();
    });

    it('handles an utterance that matches to multiple rules with unrelated trump IDs', async () => {
      const meaningMap2 = duplicateMeaningMap(meaningMap);
      meaningMap2['remove'] = [ 
        { followingWords: ['stuff'], meaningId: '2.1', trumpIds:[-6] },
        { followingWords: ['even'], meaningId: '2.2', trumpIds:[6] },
      ];
      const match = await matchMeaning('should i remove even more stuff', meaningMap2);
      expect(match?.meaningId).toEqual('2.2');
    });

    it('handles an utterance that matches no rules', async () => {
      const match = await matchMeaning('unmatchable', meaningMap);
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