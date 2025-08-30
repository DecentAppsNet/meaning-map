import { assertNonNullable } from "@/common/assertUtil";
import { importCorpus } from "@/impexp/corpusImporter";
import { exportMeaningClassifications } from "@/impexp/meaningClassificationsExporter";
import { importMeaningIndex } from "@/impexp/meaningIndexImporter";
import Meaning from "@/impexp/types/Meaning";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { replaceNumbers } from "./replaceNumbers";
import { replaceItems } from "./replaceItems";
import { prompt } from "@/llm/llmUtil";

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

async function _findBestMeaningMatch(_utterance:string, _meaningIndex:MeaningIndex, _meaningIds:string[]) {
  return UNCLASSIFIED_MEANING_ID; // TODO
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