import { isValidUtterance } from "@/classification/utteranceUtil";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMap";
import { assert } from '@/common/assertUtil';
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil";
import WordUsageMap from "../classification/types/WordUsageMap";
import TryCombination from "./types/TryCombination";
import { importMeaningClassifications } from "@/impexp/meaningClassificationsImporter";
import { endSection, log, setStatus, startSection } from "@/common/describeLog";
import { exportMeaningMap } from "@/impexp/meaningMapExporter";
import { matchMeaningForReplacedUtterance } from "./matchUtil";
import { generateWordUsageMap } from "@/classification/wordUsageUtil";
import { countUtterances, doMatchWordsMatchOtherMeanings } from "@/classification/classifyUtil";
import { addRule } from "./ruleOperationsUtil";

// Find the smallest set of words that exclusively match an utterance to one meaning ID.
function _findMinimalExclusiveMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, classifications:MeaningClassifications):string[]|null {
  assert(isValidUtterance(utterance));
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    if (!doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId)) return matchWords;
    tryCombination = findNextTryCombination(tryCombination);
  }
  return null; // No match words found that uniquely identify this utterance.
}

// Find the smallest set of words that score highest to match an utterance to one meaning ID. TODO this is wrong alg.
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

export function generateMeaningMapFromClassifications(classifications:MeaningClassifications):MeaningMap {
  const wordUsageMap = generateWordUsageMap(classifications);
  const meaningMap:MeaningMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  const postponed:PostponedUtterance[] = [];

  let addedUtteranceCount = 0;
  const utteranceCount = countUtterances(meaningIds, classifications);
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
        addRule(matchWords, meaningId, meaningMap);
        ++addedUtteranceCount;
      }
    });
    endSection();
  });

  if (postponed.length) {
    startSection(`Processing ${postponed.length} postponed utterances`);
    postponed.forEach((pu) => {
      setStatus('generating meaning map', addedUtteranceCount, utteranceCount);
      const { utterance, meaningId } = pu;
      log(`Finding match words for postponed utterance "${utterance}"`);
      const matchWords = _findMinimalScoreMatchWordsForUtterance(utterance, wordUsageMap, meaningId, meaningMap);
      if (!matchWords) {
        const text = `Failed to find unique match words for "${utterance}" within meaning map. Not adding matching rule.`;
        log(text);
        console.warn(text);
      } else {
        if (matchWords.length) addRule(matchWords, meaningId, meaningMap);
        ++addedUtteranceCount;
      }
    });
    endSection();
  }
  return meaningMap;
}

/* v8 ignore start */
export async function createMeaningMap(classificationFilepath:string, outputFilepath:string):Promise<void> {
  log(`importing classifications from ${classificationFilepath}`);
  const classifications:MeaningClassifications = await importMeaningClassifications(classificationFilepath);
  const meaningMap = generateMeaningMapFromClassifications(classifications);
  log(`exporting meaning map to ${outputFilepath}`);
  await exportMeaningMap(meaningMap, outputFilepath);
}
/* v8 ignore end */