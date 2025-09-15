import { isValidUtterance, utteranceToWords } from "@/classification/utteranceUtil";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMap";
import { assert, assertNonNullable, botch } from '@/common/assertUtil';
import MeaningMapEntry from "@/impexp/types/MeaningMapEntry";
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil";
import WordUsageMap from "./types/WordUsageMap";
import TryCombination from "./types/TryCombination";
import { importMeaningClassifications } from "@/impexp/meaningClassificationsImporter";
import { endSection, flushLog, log, setStatus, startSection } from "@/common/describeLog";
import { exportMeaningMap } from "@/impexp/meaningMapExporter";
import { match } from "assert";
import { matchMeaningForReplacedUtterance } from "./matchUtil";

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

// Find the smallest set of words that exclusively match an utterance to one meaning ID.
function _findMinimalExclusiveMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, classifications:MeaningClassifications):string[]|null {
  assert(isValidUtterance(utterance));
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    if (!_doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId)) return matchWords;
    tryCombination = findNextTryCombination(tryCombination);
  }
  return null; // No match words found that uniquely identify this utterance.
}

function _addMatchRuleToMeaningMap(matchWords:string[], meaningId:string, meaningMap:MeaningMap) {
  assert(matchWords.length > 0);
  log(`Found match words: ${matchWords.map(w => `"${w}"`).join(', ')}`);
  const firstWord = matchWords[0];
  const meaningMapEntry:MeaningMapEntry = {followingWords:matchWords.slice(1), meaningId};
  const entries = meaningMap[firstWord] || [];
  entries.push(meaningMapEntry);
  meaningMap[firstWord] = entries;
}

// Find the smallest set of words that score highest to match an utterance to one meaning ID.
function _findMinimalScoreMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, meaningMap:MeaningMap):string[]|null {
  assert(isValidUtterance(utterance));

  // Check if one of the other rules in the meaning map already matches this utterance.
  const match = matchMeaningForReplacedUtterance(utterance, meaningMap);
  if (match && match.meaningId === meaningId) return [];

  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    const tryUtterance = matchWords.join(' ');
    const match = matchMeaningForReplacedUtterance(tryUtterance, meaningMap);
 
    if (!match) return matchWords; // Words don't match against any existing rule.
    if (match.meaningId === meaningId) return []; // Words match against an existing rule that has same meaning ID.

    tryCombination = findNextTryCombination(tryCombination);
  }
  return null; // No match words found that uniquely match this utterance by score.
}

type PostponedUtterance = {
  utterance:string,
  meaningId:string
};

function _countUtterances(meaningIds:string[], classifications:MeaningClassifications):number {
  let total = 0;
  meaningIds.forEach(meaningId => total += classifications[meaningId].length);
  return total;
}

export function generateMeaningMapFromClassifications(classifications:MeaningClassifications):MeaningMap {
  const wordUsageMap = _generateWordUsageMap(classifications);
  const meaningMap:MeaningMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  const postponed:PostponedUtterance[] = [];

  let addedUtteranceCount = 0;
  const utteranceCount = _countUtterances(meaningIds, classifications);
  meaningIds.forEach((meaningId) => {
    setStatus('generating meaning map', addedUtteranceCount, utteranceCount);
    startSection(`Processing meaning ID ${meaningId}`);
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      log(`Finding match words for utterance "${utterance}"`);
      assert(isValidUtterance(utterance));
      const matchWords = _findMinimalExclusiveMatchWordsForUtterance(utterance, wordUsageMap, meaningId, classifications);
      if (!matchWords) {
        log(`Postponed utterance "${utterance}" since no unique match words found`);
        postponed.push({utterance, meaningId});
      } else {
        _addMatchRuleToMeaningMap(matchWords, meaningId, meaningMap);
        ++addedUtteranceCount;
      }
    });
    endSection();
  });

  if (postponed.length) {
    startSection(`Processing ${postponed.length} postponed utterances`);
    postponed.forEach((pu, puI) => {
      setStatus('generating meaning map', addedUtteranceCount, utteranceCount);
      const { utterance, meaningId } = pu;
      log(`Finding match words for postponed utterance "${utterance}"`);
      const matchWords = _findMinimalScoreMatchWordsForUtterance(utterance, wordUsageMap, meaningId, meaningMap);
      if (!matchWords) {
        const text = `Failed to find unique match words for "${utterance}" within meaning map. Not adding matching rule.`;
        log(text);
        console.warn(text);
      } else {
        if (matchWords.length) _addMatchRuleToMeaningMap(matchWords, meaningId, meaningMap);
        ++addedUtteranceCount;
      }
    });
    endSection();
  }
  return meaningMap;
}

/* v8 ignore start */
export async function createMeaningMap(classificationFilepath:string, outputFilepath:string):Promise<MeaningMap> {
  log(`importing classifications from ${classificationFilepath}`);
  const classifications:MeaningClassifications = await importMeaningClassifications(classificationFilepath);
  const meaningMap = generateMeaningMapFromClassifications(classifications);
  log(`exporting meaning map to ${outputFilepath}`);
  await exportMeaningMap(meaningMap, outputFilepath);
}
/* v8 ignore end */

export const TestExports = {
  _generateWordUsageMap,
  _doMatchWordsMatchUtterance
};