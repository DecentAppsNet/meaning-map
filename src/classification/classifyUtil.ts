import { assertNonNullable, assert } from "@/common/assertUtil";
import { importCorpus } from "@/impexp/corpusImporter";
import { exportMeaningClassifications } from "@/impexp/meaningClassificationsExporter";
import { importMeaningIndex } from "@/impexp/meaningIndexImporter";
import Meaning from "@/impexp/types/Meaning";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { replaceNumbers } from "./replaceNumbers";
import { replaceItems } from "./replaceItems";
import { prompt } from "@/llm/llmUtil";
import NShotPair from "@/llm/types/NShotPair";
import { isDigitChar } from "@/common/regExUtil";

async function _makeReplacements(utterance:string):Promise<string> {
  // This logic is coupled to Bintopia. Think about generalizing it later.
  utterance = await replaceItems(utterance); // Numbers might be part of ITEMS, e.g. "two apples".
  utterance = replaceNumbers(utterance); // Numbers that aren't part of ITEMS will be NUMBERS.
  return utterance;
}

function _findTopLevelMeaningIds(meaningIndex:MeaningIndex):string[] {
  return Object.keys(meaningIndex).filter(id => id !== UNCLASSIFIED_MEANING_ID && id.indexOf('.') === -1);
}

function _findChildMeaningIds(meaningId:string, meaningIndex:MeaningIndex):string[] {
  if (meaningId === UNCLASSIFIED_MEANING_ID) return _findTopLevelMeaningIds(meaningIndex);
  const meaning = meaningIndex[meaningId];
  return meaning ? meaning.childMeaningIds : [];
}

async function _evaluateMeaningMatch(utterance:string, meaning:Meaning):Promise<string> {
  const SYSTEM_MESSAGE = `User will say a phrase. ` +
    `Output a single letter "Y" for yes, "N" for no, or "M" for maybe ` + 
    `based on your certainty that the user's phrase matches the following rule: ${meaning.promptInstructions}\n` +
    `Do not output more or less than a single letter.`;
  const response = await prompt(utterance, SYSTEM_MESSAGE, meaning.nShotPairs, 2);
  const singleChar = response.trim().toUpperCase().substring(0, 1);
  if (['Y', 'N', 'M'].includes(singleChar)) return singleChar;
  return 'M';
}

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
  return meaningIds.map((id, i) => `${i} ${meaningIndex[id].promptInstructions}`).join('\n');
}

function _doesAnotherMeaningHaveSameNShotPair(meaningIndex:MeaningIndex, meaningId:string, nShotPair:NShotPair):boolean {
  return Object.keys(meaningIndex).some(compareMeaningId => {
    if (compareMeaningId === meaningId) return false;
    const compareMeaning = meaningIndex[compareMeaningId];
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
      assert(parentMeaningId === meaning.parentMeaningId, `All meanings passed should have same parent ID.`);
    }
    for (let j = 0; j < meaning.nShotPairs.length; ++j) {
      const pair = meaning.nShotPairs[j];
      if (pair.assistantResponse !== 'Y') continue;
      const hasYesDuplicate = _doesAnotherMeaningHaveSameNShotPair(meaningIndex, meaningId, pair);
      if (hasYesDuplicate) {
        console.warn(`The same "Y" n-shot pair is used in 2 or more children of meaning ID ${meaning.parentMeaningId}. You should treat these "Y" examples at mutually exclusive for better classification.`);
        continue;
      }
      _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:`${i}`}, combined);
    }
  }
  
  // If parent meaning ID is "0", add all "Y" pairs from UNCLASSIFIED_MEANING_ID.
  assertNonNullable(parentMeaningId);
  const parentMeaning = meaningIndex[parentMeaningId];
  // assertNonNullable(parentMeaning); TODO - need update to import format. But then this code will work.
  if (parentMeaningId !== UNCLASSIFIED_MEANING_ID && parentMeaning) { // TODO - remove && parentMeaning
    parentMeaning.nShotPairs.forEach(pair => {
      if (pair.assistantResponse === 'Y') {
        _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:UNCLASSIFIED_MEANING_ID}, combined);
      }
    });
  } else { // Add all "N" pairs from parent meaning with UNCLASSIFIED_MEANING_ID as response.
    parentMeaning.nShotPairs.forEach(pair => {
      if (pair.assistantResponse === 'N') {
        _addNShotPairIfUserMessageUnique({userMessage:pair.userMessage, assistantResponse:UNCLASSIFIED_MEANING_ID}, combined);
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
  const meaningI = _parseNumberFromResponse(response);
  if (meaningI === 0 || meaningI < 0 || meaningI >= meaningIds.length) return UNCLASSIFIED_MEANING_ID
  return meaningIds[meaningI];
}

function _findMeaningIdsShortList(meaningIds:string[], evals:string[]):string[] {
  if (evals.includes('Y')) return meaningIds.filter((_id, i) => evals[i] === 'Y');
  if (evals.includes('M')) return meaningIds.filter((_id, i) => evals[i] === 'M');
  return [];
}

async function _classifyUtterance(utterance:string, meaningIndex:MeaningIndex, parentMeaningId:string = UNCLASSIFIED_MEANING_ID):Promise<string> {
  let evalMeaningIds:string[] = _findChildMeaningIds(parentMeaningId, meaningIndex);
  if (!evalMeaningIds.length) return parentMeaningId;

  const evals:string[] = [];
  evalMeaningIds.forEach(async (meaningId:string) => {
    const meaning = meaningIndex[meaningId];
    assertNonNullable(meaning);
    const meaningEval = await _evaluateMeaningMatch(utterance, meaning);
    evals.push(meaningEval);
  });

  evalMeaningIds = _findMeaningIdsShortList(evalMeaningIds, evals);
  if (!evalMeaningIds.length) return parentMeaningId;
  if (evalMeaningIds.length === 1) return await _classifyUtterance(utterance, meaningIndex, evalMeaningIds[0]);

  const bestMeaningId = await _findBestMeaningMatch(utterance, meaningIndex, evalMeaningIds);
  return await _classifyUtterance(utterance, meaningIndex, bestMeaningId);
}

export async function classify(corpus:string[], meaningIndex:MeaningIndex):Promise<MeaningClassifications> {
  const classifications:MeaningClassifications = {};
  corpus.forEach(async (utterance:string) => {
    utterance = await _makeReplacements(utterance);
    const meaningId = await _classifyUtterance(utterance, meaningIndex);
    if (!classifications[meaningId]) classifications[meaningId] = [];
    classifications[meaningId].push(utterance);
  });
  return classifications;
}

export async function createMeaningClassification(corpusFilepath:string, meaningIndexFilepath:string, classificationFilepath:string) {
  const corpus = await importCorpus(corpusFilepath);
  const meaningIndex = await importMeaningIndex(meaningIndexFilepath);
  const classifications = await classify(corpus, meaningIndex);
  exportMeaningClassifications(classifications, classificationFilepath, meaningIndex);
}

export const TestExports = {
  _evaluateMeaningMatch,
  _concatCandidateMeanings
}