import { assert, assertNonNullable } from '@/common/assertUtil';
import NShotPair from "@/llm/types/NShotPair";
import { isUtteranceNormalized } from "./utteranceUtil";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from '@/impexp/types/MeaningIndex';

export function findMatchingNShotResponse(utterance:string, nShotPairs:NShotPair[]):string|null {
  assert(isUtteranceNormalized(utterance), `Utterance not normalized: "${utterance}"`);
  for(let i = 0; i < nShotPairs.length; ++i) {
    if (nShotPairs[i].userMessage.toLowerCase() === utterance.toLowerCase()) return nShotPairs[i].assistantResponse;
  }
  return null;
}

function _doesAnotherSiblingMeaningHaveSameNShotPair(meaningIndex:MeaningIndex, meaningId:string, nShotPair:NShotPair):boolean {
  const parentMeaningId = meaningIndex[meaningId].parentMeaningId;
  return Object.keys(meaningIndex).some(compareMeaningId => {
    if (compareMeaningId === meaningId) return false;
    const compareMeaning = meaningIndex[compareMeaningId];
    if (compareMeaning.parentMeaningId !== parentMeaningId) return false;
    for(let i = 0; i < compareMeaning.nShotPairs.length; ++i) {
      const comparePair:NShotPair = compareMeaning.nShotPairs[i];
      if (comparePair.userMessage === nShotPair.userMessage && comparePair.assistantResponse === nShotPair.assistantResponse) return true;
    }
    return false;
  });
}

function _addNShotPairIfUserMessageUnique(pair:NShotPair, pairs:NShotPair[]) {
  if (pairs.some(comparePair => comparePair.userMessage === pair.userMessage)) {
    console.warn(`Duplicate n-shot pair found for userMessage of ${pair.userMessage}.`);
    return;
  }
  pairs.push(pair);
}

export function combineMeaningNShotPairs(meaningIndex:MeaningIndex, meaningIds:string[]):NShotPair[] {
  const combined:NShotPair[] = [];

  // Add all "Y" pairs that don't have duplicates across different meanings. If any duplicates found, log a warning,
  // because meanings at child level should have mutually exclusive positives in n-shot.
  let parentMeaningId:string|null = null;
  for(let i = 0; i < meaningIds.length; ++i) {
    const meaningId = meaningIds[i];
    const meaning = meaningIndex[meaningId];
    assertNonNullable(meaning);
    if (parentMeaningId === null) {
      parentMeaningId = meaning.parentMeaningId;
    } else {
      if (parentMeaningId !== meaning.parentMeaningId) throw Error(`Expected all meanings passed to have same parent meaning ID of "${parentMeaningId}".`);
    }
    for (let j = 0; j < meaning.nShotPairs.length; ++j) {
      const pair = meaning.nShotPairs[j];
      if (pair.assistantResponse !== 'Y') continue;
      const hasYesDuplicate = _doesAnotherSiblingMeaningHaveSameNShotPair(meaningIndex, meaningId, pair);
      if (hasYesDuplicate) {
        console.warn(`A "Y" n-shot pair for #${meaningId}, userMessage "${pair.userMessage}" is also used by a different child of #${meaning.parentMeaningId}. You should define these "Y" examples as mutually exclusive for better classification.`);
        continue;
      }
      _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:`${i+1}`}, combined);
    }
  }
  
  // If parent meaning ID is "0", add all "Y" pairs from UNCLASSIFIED_MEANING_ID.
  assertNonNullable(parentMeaningId);
  const parentMeaning = meaningIndex[parentMeaningId];
  if (parentMeaningId === UNCLASSIFIED_MEANING_ID && parentMeaning) {
    parentMeaning.nShotPairs.forEach(pair => {
      if (pair.assistantResponse === 'Y') {
        _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:'0'}, combined);
      }
    });
  } else { // Add all "N" pairs from parent meaning with UNCLASSIFIED_MEANING_ID as response.
    parentMeaning.nShotPairs.forEach(pair => {
      if (pair.assistantResponse === 'N') {
        _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:'0'}, combined);
      }
    });
  }

  return combined;
}