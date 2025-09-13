import { assertNonNullable, assert } from "@/common/assertUtil";
import { importCorpus } from "@/impexp/corpusImporter";
import { exportMeaningClassifications } from "@/impexp/meaningClassificationsExporter";
import { importMeaningIndex } from "@/impexp/meaningIndexImporter";
import Meaning from "@/impexp/types/Meaning";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { prompt } from "@/llm/llmUtil";
import NShotPair from "@/llm/types/NShotPair";
import { isDigitChar } from "@/common/regExUtil";
import { findParamsInUtterance, isUtteranceNormalized } from "./utteranceUtil";
import { endSection, log, setStatus, startSection } from "@/common/describeLog";
import { makeUtteranceReplacements } from '@/replacement/replaceUtil';

function _findTopLevelMeaningIds(meaningIndex:MeaningIndex):string[] {
  return Object.keys(meaningIndex).filter(id => id !== UNCLASSIFIED_MEANING_ID && id.indexOf('.') === -1);
}

function _findChildMeaningIds(meaningId:string, meaningIndex:MeaningIndex):string[] {
  if (meaningId === UNCLASSIFIED_MEANING_ID) return _findTopLevelMeaningIds(meaningIndex);
  const meaning = meaningIndex[meaningId];
  assertNonNullable(meaning, `${meaningId} not found in meaningIndex.`);
  return meaning.childMeaningIds;
}

function _findMatchingNShotResponse(utterance:string, nShotPairs:NShotPair[]):string|null {
  assert(isUtteranceNormalized(utterance), `Utterance not normalized: "${utterance}"`);
  for(let i = 0; i < nShotPairs.length; ++i) {
    if (nShotPairs[i].userMessage.toLowerCase() === utterance.toLowerCase()) return nShotPairs[i].assistantResponse;
  }
  return null;
}

function _doesUtteranceContainAllParams(utterance:string, params:string[]):boolean {
  assert(isUtteranceNormalized(utterance), `Utterance not normalized: "${utterance}"`);
  const utteranceParams = findParamsInUtterance(utterance);
  return params.every(param => utteranceParams.some(u => u === param));
}

async function _evaluateMeaningMatch(utterance:string, meaning:Meaning):Promise<string> {
  const nShotResponse = _findMatchingNShotResponse(utterance, meaning.nShotPairs);
  if (nShotResponse) return nShotResponse; // No need to prompt if n-shot already specifies a response.
  if (!_doesUtteranceContainAllParams(utterance, meaning.params)) return 'N'; // Impossible to match if not all params present.
  const SYSTEM_MESSAGE = `User will say a phrase. ` +
    `Output a single letter "Y" for yes, "N" for no, or "M" for maybe ` + 
    `based on your certainty that the user's phrase matches the following rule: ${meaning.promptInstructions}\n` +
    `Do not output more or less than a single letter.`;
  const response = await prompt(utterance, SYSTEM_MESSAGE, meaning.nShotPairs, 2);
  const singleChar = response.trim().toUpperCase().substring(0, 1);
  /* v8 ignore start */ // The false path below is not worth contriving for.
  if (['Y', 'N', 'M'].includes(singleChar)) return singleChar;
  // LLM didn't follow instructions. Just return "maybe" and keep moving.
  return 'M';
}
/* v8 ignore end */

// Find first contiguous sequence of digits and return as a number, or -1 if none found.
function _parseNumberFromResponse(response:string):number {
  response = response.trim();
  let startPos = 0;
  while(startPos < response.length && !isDigitChar(response[startPos])) ++startPos;
  if (startPos === response.length) return -1;
  let endPos = startPos + 1;
  while(endPos < response.length && isDigitChar(response[endPos])) ++endPos;
  return parseInt(response.substring(startPos, endPos));
}

function _concatCandidateMeanings(meaningIds:string[], meaningIndex:MeaningIndex):string {
  return meaningIds.map((id, i) => `${i+1} ${meaningIndex[id].promptInstructions}`).join('\n');
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

function _combineMeaningNShotPairs(meaningIndex:MeaningIndex, meaningIds:string[]):NShotPair[] {
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
        console.warn(`A "Y" n-shot pair for #${meaningId}, userMessage "${pair.userMessage}" is also used by a different child of #${meaning.parentMeaningId}. You should treat these "Y" examples at mutually exclusive for better classification.`);
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

async function _findBestMeaningMatch(utterance:string, meaningIndex:MeaningIndex, meaningIds:string[]):Promise<string> {
  const candidateMeanings = _concatCandidateMeanings(meaningIds, meaningIndex); 
  const SYSTEM_MESSAGE = `User will say a phrase. ` +
    `Output the prefixing number of the best matching meaning from the following list of candidate meanings: \n` +
    `${candidateMeanings}\n` +
    `If none of the meanings are a good match, output "0". Do not output anything besides a single number.`;
  const nShotPairs:NShotPair[] = _combineMeaningNShotPairs(meaningIndex, meaningIds);
  const response = await prompt(utterance, SYSTEM_MESSAGE, nShotPairs, 8);
  const meaningI = _parseNumberFromResponse(response) - 1;
  if (meaningI < 0 || meaningI >= meaningIds.length) return UNCLASSIFIED_MEANING_ID
  return meaningIds[meaningI];
}

function _findMeaningIdsShortList(meaningIds:string[], evals:string[]):string[] {
  if (evals.includes('Y')) return meaningIds.filter((_id, i) => evals[i] === 'Y');
  if (evals.includes('M')) return meaningIds.filter((_id, i) => evals[i] === 'M');
  return [];
}

function _describeMeaning(meaning:Meaning):string {
  return `#${meaning.meaningId} (${meaning.description})`;
}

function _describeMeaningId(meaningIndex:MeaningIndex, meaningId:string):string {
  if (meaningId === UNCLASSIFIED_MEANING_ID) return `#${UNCLASSIFIED_MEANING_ID} (unclassified)`;
  const meaning = meaningIndex[meaningId];
  if (!meaning) return `#${meaningId} (unknown)`;
  return _describeMeaning(meaning);
}

async function _classifyUtteranceRecursively(utterance:string, meaningIndex:MeaningIndex, parentMeaningId:string = UNCLASSIFIED_MEANING_ID):Promise<string> {
  let evalMeaningIds:string[] = _findChildMeaningIds(parentMeaningId, meaningIndex);
  if (!evalMeaningIds.length) { log(`Classified utterance as ${_describeMeaningId(meaningIndex, parentMeaningId)}.`); return parentMeaningId; }

  startSection(`Classifying under parent ${_describeMeaningId(meaningIndex, parentMeaningId)}.`);
  try {
    assert(isUtteranceNormalized(utterance), `Utterance not normalized: "${utterance}"`);

    startSection(`Evaluating ${evalMeaningIds.length} child meanings.`);
      const evals:string[] = [];
      for(let i = 0; i < evalMeaningIds.length; ++i) { // Don't promise.all() because LLM inference won't handle it well, and I prefer a deterministic order for tests.
        const meaningId = evalMeaningIds[i];
        const meaning = meaningIndex[meaningId];
        assertNonNullable(meaning);
        const meaningEval = await _evaluateMeaningMatch(utterance, meaning);
        log(`${_describeMeaningId(meaningIndex, meaningId)} evaluated to ${meaningEval}.`);
        evals.push(meaningEval);
      };
    endSection();

    evalMeaningIds = _findMeaningIdsShortList(evalMeaningIds, evals);
    if (!evalMeaningIds.length) { log(`All child meanings rejected - returning parent ${_describeMeaningId(meaningIndex, parentMeaningId)}.`); return parentMeaningId; }
    if (evalMeaningIds.length === 1) { log(`Only one child meaning candidate - ${evalMeaningIds[0]}`); return await _classifyUtteranceRecursively(utterance, meaningIndex, evalMeaningIds[0]); }

    startSection(`Directly comparing the following ${evalMeaningIds.length} candidate meanings: ${evalMeaningIds.join(', ')}.`);
      const bestMeaningId = await _findBestMeaningMatch(utterance, meaningIndex, evalMeaningIds);
      log(`Best meaning is ${_describeMeaningId(meaningIndex, bestMeaningId)}.`);
    endSection();
    
    return await _classifyUtteranceRecursively(utterance, meaningIndex, bestMeaningId);
  } finally {
    endSection();
  }
}

function _logUtterance(utterance:string, original:string):void {
  if (utterance !== original) {
    log(`*** utterance: "${utterance}" from original "${original}"`);
  } else {
    log(`*** utterance: "${utterance}"`);
  }
}

export async function classifyUtterance(utterance:string, meaningIndex:MeaningIndex):Promise<string> {
  const [replacedUtterance] = await makeUtteranceReplacements(utterance);
  _logUtterance(replacedUtterance, utterance);
  const unclassifiedMeaning = meaningIndex[UNCLASSIFIED_MEANING_ID];
  if (unclassifiedMeaning) { 
    const response = _findMatchingNShotResponse(replacedUtterance, unclassifiedMeaning.nShotPairs);
    if (response === 'Y') { log('Matched unclassified n-shot - returning #0.'); return UNCLASSIFIED_MEANING_ID; }
  }
  return await _classifyUtteranceRecursively(replacedUtterance, meaningIndex, UNCLASSIFIED_MEANING_ID);  
}

export async function classify(corpus:string[], meaningIndex:MeaningIndex):Promise<MeaningClassifications> {
  const classifications:MeaningClassifications = {};
  startSection(`Classifying corpus - ${corpus.length} utterances`);
    for(let i = 0; i < corpus.length; ++i) {
      setStatus(`Classifying`, i+1, corpus.length);
      assert(isUtteranceNormalized(corpus[i]), `Utterance not normalized: "${corpus[i]}"`);
      const [replacedUtterance] = await makeUtteranceReplacements(corpus[i]);
      _logUtterance(replacedUtterance, corpus[i]);
      const meaningId = await _classifyUtteranceRecursively(replacedUtterance, meaningIndex);
      if (!classifications[meaningId]) classifications[meaningId] = [];
      if (!classifications[meaningId].includes(replacedUtterance)) classifications[meaningId].push(replacedUtterance); // Note that replacing items/numbers can cause duplicates even if corpus doesn't have duplicates.
    }
  endSection();
  return classifications;
}

export async function createMeaningClassification(corpusFilepath:string, meaningIndexFilepath:string, classificationFilepath:string) {
  const corpus = await importCorpus(corpusFilepath);
  const meaningIndex = await importMeaningIndex(meaningIndexFilepath);
  const classifications:MeaningClassifications = {};
  for(let i = 0; i < corpus.length; ++i) {
    setStatus(`Classifying`, i+1, corpus.length);
    assert(isUtteranceNormalized(corpus[i]), `Utterance not normalized: "${corpus[i]}"`);
    const [replacedUtterance] = await makeUtteranceReplacements(corpus[i]);
    _logUtterance(replacedUtterance, corpus[i]);
    const meaningId = await _classifyUtteranceRecursively(replacedUtterance, meaningIndex);
    if (!classifications[meaningId]) classifications[meaningId] = [];
    if (!classifications[meaningId].includes(replacedUtterance)) classifications[meaningId].push(replacedUtterance);
    exportMeaningClassifications(classifications, classificationFilepath, meaningIndex); // Exports multiple times because it can be a long-running process.
  }
}

export const TestExports = {
  _evaluateMeaningMatch,
  _concatCandidateMeanings,
  _combineMeaningNShotPairs,
  _findMeaningIdsShortList,
}