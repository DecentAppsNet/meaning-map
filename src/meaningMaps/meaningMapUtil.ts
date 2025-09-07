import { isPlainUtterance, isValidUtterance, utteranceToWords } from "@/classification/utteranceUtil";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMap";
import { assert, botch } from '@/common/assertUtil';
import MeaningMapEntry from "@/impexp/types/MeaningMapEntry";
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil";
import WordUsageMap from "./types/WordUsageMap";
import TryCombination from "./types/TryCombination";
import { makeUtteranceReplacements } from "@/replacement/replaceUtil";
import MeaningMatch from "./types/MeaningMatch";
import ReplacedValues from "@/replacement/types/ReplacedValues";

// TODO anything you assert in this module that points to invalid data in classifications, needs to be validated in the classifications importer.
// Best way is probably to write an explicit validateClassifications() function and call it from the importer.


function _generateWordUsageMap(classifications:MeaningClassifications):WordUsageMap {
  const wordUsageMap:WordUsageMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      assert(isValidUtterance(utterance));
      const words = utteranceToWords(utterance);
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

function _doMatchWordsMatchUtterance(matchWords:string[], utterance:string):boolean {
  assert(isValidUtterance(utterance));
  assert(matchWords.length > 0);
  const words = utteranceToWords(utterance);
  let matchFromI = 0;
  for(let matchWordI = 0; matchWordI < matchWords.length; ++matchWordI) {
    const matchWord = matchWords[matchWordI];
    for(; matchFromI < words.length; ++matchFromI) {
      if (words[matchFromI] === matchWord) break;
    }
    if (matchFromI === words.length) return false; // The current match word couldn't be found in utterance.
    ++matchFromI; // Found current match word. Next match word should be looked for after this one.
  }
  return true; // All match words found.
}

function _doMatchWordsMatchOtherMeanings(matchWords:string[], classifications:MeaningClassifications, excludeMeaningId:string):boolean {
  const meaningIds = Object.keys(classifications).filter(meaningId => meaningId !== excludeMeaningId);
  return meaningIds.some(meaningId => {
    const utterances = classifications[meaningId];
    return utterances.some(utterance => {
      return _doMatchWordsMatchUtterance(matchWords, utterance);
    });
  });
}

function _findMinimalMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, classifications:MeaningClassifications):string[] {
  assert(isValidUtterance(utterance));
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    if (!_doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId)) return matchWords;
    tryCombination = findNextTryCombination(tryCombination);
  /* v8 ignore start */
  }
  botch();
  /* v8 ignore end */
}

export function generateMeaningMapFromClassifications(classifications:MeaningClassifications):MeaningMap {
  const wordUsageMap = _generateWordUsageMap(classifications);
  const meaningMap:MeaningMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      assert(isValidUtterance(utterance));
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

type ActiveMatch = {
  remainingWords:string[],
  meaningId:string
}

function _addActiveMatchesForFirstWord(firstWord:string, remainingEvalCount:number, meaningMap:MeaningMap, activeMatches:ActiveMatch[]):string|null {
  const entries = meaningMap[firstWord];
  if (!entries) return null;
  for(let entryI = 0; entryI < entries.length; ++entryI) {
    const entry = entries[entryI];
    if (!entry.followingWords.length) return entry.meaningId; // Match complete! Coupled to the knowledge that caller doesn't care about active matches after one is found.
    if (entry.followingWords.length > remainingEvalCount) continue; // Impossible to match since it needs more words than are left for me to evaluate.
    activeMatches.push({remainingWords:entry.followingWords, meaningId:entry.meaningId});
  }
  return null;
}

function _updateActiveMatches(word:string, remainingEvalCount:number, activeMatches:ActiveMatch[]):string|null {
  for(let i = 0; i < activeMatches.length; ++i) {
    if (activeMatches[i].remainingWords[0] === word) {
      const activeMatch = activeMatches[i];
      activeMatch.remainingWords.shift();
      if (activeMatch.remainingWords.length === 0) return activeMatch.meaningId; // Match complete! Coupled to the knowledge that caller doesn't care about updating matches after one is found.
    }
  }
  // Cull matches that are impossible because not enough words remain to match them.
  activeMatches = activeMatches.filter(am => am.remainingWords.length <= remainingEvalCount);
  return null; // No match found yet.
}

export function matchMeaningForReplacedUtterance(replacedUtterance:string, meaningMap:MeaningMap, replacedValues:ReplacedValues):MeaningMatch|null {
  assert(isValidUtterance(replacedUtterance));
  const words = utteranceToWords(replacedUtterance);
  const activeMatches:ActiveMatch[] = [];
  let remainingEvalCount = words.length, meaningId:string|null = null;
  for(let wordI = 0; wordI < words.length; ++wordI) {
    const word = words[wordI];
    meaningId = _updateActiveMatches(word, remainingEvalCount, activeMatches);
    if (meaningId) break;
    meaningId = _addActiveMatchesForFirstWord(word, --remainingEvalCount, meaningMap, activeMatches);
    if (meaningId) break;
  }
  if (!meaningId) return null; // No match found.
  return { meaningId, paramValues:replacedValues };
}

export async function matchMeaning(plainUtterance:string, meaningMap:MeaningMap):Promise<MeaningMatch|null> {
  assert(isPlainUtterance(plainUtterance));
  const [replacedUtterance, replacedValues] = await makeUtteranceReplacements(plainUtterance);
  return matchMeaningForReplacedUtterance(replacedUtterance, meaningMap, replacedValues);
}

export const TestExports = {
  _generateWordUsageMap,
  _doMatchWordsMatchUtterance
};