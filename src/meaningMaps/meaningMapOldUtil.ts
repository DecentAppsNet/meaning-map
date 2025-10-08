import { isValidUtterance } from "@/classification/utteranceUtil";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMapOld";
import { assert } from '@/common/assertUtil';
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil";
import WordUsageMap from "../classification/types/WordUsageMap";
import TryCombination from "./types/TryCombination";
import { importMeaningClassifications } from "@/impexp/meaningClassificationsImporter";
import { endSection, log, setStatus, startSection } from "@/common/describeLog";
import { exportMeaningMap } from "@/impexp/meaningMapOldExporter";
import { generateWordUsageMap } from "@/classification/wordUsageUtil";
import { countUtterances, doMatchWordsMatchOtherMeanings } from "@/classification/classifyUtil";
import { addRule } from "./ruleOperationsUtil";
import SubsetIndex from "./types/SubsetIndex";
import { addTrumpsForSubsetsAndSupersets, areMeaningMapTrumpsValid, createSubsetIndex } from "./supersetUtil";
import UtteranceToRuleReferenceMap from "./types/RuleReferenceIndex";
import { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { matchMeaning } from "./matchUtil";
import { unreplaceWithPlaceholders } from "@/replacement/replaceUtil";

function _getExcludedSupersetUtterances(utterance:string, subsetIndex:SubsetIndex):Set<string>|undefined {
  const subset = subsetIndex[utterance];
  if (!subset) return undefined;
  return new Set(subset.supersetUtterances);
}

// Find the smallest set of words that exclusively match an utterance to one meaning ID.
function _findMinimalDistinguishingMatchWordsForUtterance(utterance:string, wordUsageMap:WordUsageMap, meaningId:string, 
    classifications:MeaningClassifications, subsetIndex:SubsetIndex):string[] {
  assert(isValidUtterance(utterance));
  const excludedUtterances = _getExcludedSupersetUtterances(utterance, subsetIndex);
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  while(tryCombination) {
    const matchWords = concatMatchWords(tryCombination);
    if (!doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId, excludedUtterances)) return matchWords;
    tryCombination = findNextTryCombination(tryCombination);
    /* v8 ignore start */
  }
  /* No distinguishing combination of match words found. This should be impossible because:

  1. every utterance in the classification is unique. 
  2. using 100% of the words in the utterance as match words will distinguish from all other utterances aside from supersets
  3. for supersets, these can always be distinguished for the subsets by using 100% of their words as match words

  But I'll throw instead of assert/botch in case I'm wrong and there's a rare edge case left. */
  throw new Error(`Failed to find unique match words for "${utterance}" within classifications.`);
}
/* v8 ignore end */

export function generateMeaningMapFromClassifications(classifications:MeaningClassifications):MeaningMap {
  const wordUsageMap = generateWordUsageMap(classifications);
  const meaningMap:MeaningMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  const subsetIndex = createSubsetIndex(classifications);
  const utteranceToRuleReferenceMap:UtteranceToRuleReferenceMap = {};

  let addedUtteranceCount = 0;
  const utteranceCount = countUtterances(meaningIds, classifications);
  meaningIds.forEach((meaningId) => {
    setStatus('generating meaning map', addedUtteranceCount, utteranceCount);
    startSection(`Processing meaning ID ${meaningId}`);
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      log(`Finding match words for utterance "${utterance}"`);
      assert(isValidUtterance(utterance));
      const matchWords = _findMinimalDistinguishingMatchWordsForUtterance(utterance, wordUsageMap, meaningId, classifications, subsetIndex);
      const ruleReference = addRule(matchWords, meaningId, meaningMap);
      utteranceToRuleReferenceMap[utterance] = ruleReference;
      ++addedUtteranceCount;
    });
    endSection();
  });
  addTrumpsForSubsetsAndSupersets(subsetIndex, utteranceToRuleReferenceMap);
  assert(areMeaningMapTrumpsValid(meaningMap));
  
  return meaningMap;
}

type MatchMiss = { utterance:string, expectedMeaningId:string, actualMeaningId:string };
export async function doesMeaningMapCorrectlyMatchClassifications(meaningMap:MeaningMap, classifications:MeaningClassifications):Promise<boolean> {
  startSection('verifying meaning map against classifications');
  try {
    const meaningIds = Object.keys(classifications);
    const utteranceCount = countUtterances(meaningIds, classifications);
    const misses:MatchMiss[] = [];
    let utterancesMatched = 0;
    for(let i = 0; i < meaningIds.length; ++i) {
      const meaningId = meaningIds[i];
      const utterances = classifications[meaningId];
      for(let utteranceI = 0; utteranceI < utterances.length; ++utteranceI) {
        const utterance = unreplaceWithPlaceholders(utterances[utteranceI]);
        setStatus(`matching "${utterance}`, utterancesMatched, utteranceCount);
        const match = await matchMeaning(utterance, meaningMap);
        const actualMeaningId = match ? match.meaningId : UNCLASSIFIED_MEANING_ID;
        if (actualMeaningId !== meaningId) {
          misses.push({ utterance, expectedMeaningId: meaningId, actualMeaningId });
        }
        ++utterancesMatched;
      }
    } 
    if (misses.length === 0) {
      setStatus('All utterances correctly matched.', utteranceCount, utteranceCount);
      return true;
    }
    log(`${misses.length} utterances failed to match correctly:`);
    misses.forEach(miss => {
      log(`  Utterance "${miss.utterance}" expected meaning ID ${miss.expectedMeaningId} but got ${miss.actualMeaningId}.`);
    });
    setStatus('Meaning map did not correctly match all utterances.', utteranceCount, utteranceCount);
    return false;
  } finally {
    endSection();
  }
}

/* v8 ignore start */
export async function createMeaningMap(classificationFilepath:string, outputFilepath:string):Promise<void> {
  log(`importing classifications from ${classificationFilepath}`);
  const classifications:MeaningClassifications = await importMeaningClassifications(classificationFilepath);
  const meaningMap = generateMeaningMapFromClassifications(classifications);
  const isValid = await doesMeaningMapCorrectlyMatchClassifications(meaningMap, classifications);
  if (!isValid) log('WARNING: generated meaning map does not correctly match classifications.');
  log(`exporting meaning map to ${outputFilepath}`);
  await exportMeaningMap(meaningMap, outputFilepath);
  setStatus('Finished creating meaning map.', 1, 1);
}
/* v8 ignore end */