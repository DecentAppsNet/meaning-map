import { isUtteranceNormalized } from "@/classification/utteranceUtil";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMap";
import { assert, botch } from '@/common/assertUtil';
import MeaningMapEntry from "@/impexp/types/MeaningMapEntry";
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil";
import WordUsageMap from "./types/WordUsageMap";
import TryCombination from "./types/TryCombination";

// TODO anything you assert in this module that points to invalid data in classifications, needs to be validated in the classifications importer.
// Best way is probably to write an explicit validateClassifications() function and call it from the importer.

function _generateWordUsageMap(classifications:MeaningClassifications):WordUsageMap {
  const wordUsageMap:WordUsageMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      assert(isUtteranceNormalized(utterance));
      if (!utterance.length) return;
      const words = utterance.split(' ');
      words.forEach(word => {
        let entry = wordUsageMap[word];
        if (!entry) {
          entry = {usageCount:0, meaningIds:new Set([meaningId])};
          wordUsageMap[word] = entry;
        }
        entry.usageCount++;
        entry.meaningIds.add(meaningId);
      });
    });
  });
  return wordUsageMap;
}

function _doMatchWordsMatchOtherMeanings(_matchWords:string[], _classifications:MeaningClassifications, _meaningId:string):boolean {
  //TODO
  return true;
}

function _findMinimalMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, classifications:MeaningClassifications):string[] {
  assert(isUtteranceNormalized(utterance));
  assert(utterance.length > 0);
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    if (!_doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId)) return matchWords;
    tryCombination = findNextTryCombination(tryCombination);
  }
  botch();
}

export function generateMeaningMapFromClassifications(classifications:MeaningClassifications):MeaningMap {
  const wordUsageMap = _generateWordUsageMap(classifications);
  const meaningMap:MeaningMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      const matchWords = _findMinimalMatchWordsForUtterance(utterance, wordUsageMap, meaningId, classifications);
      assert(matchWords.length > 0);
      const firstWord = matchWords[0];
      const meaningMapEntry:MeaningMapEntry = {followingWords:matchWords.slice(1), meaningId};
      const entries = meaningMap[firstWord] || [];
      entries.push(meaningMapEntry);
      meaningMap[firstWord] = entries;
    });
  });

  return meaningMap;
}

export const TestExports = {
  _generateWordUsageMap
};