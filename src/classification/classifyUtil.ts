import { assertNonNullable, assert } from "@/common/assertUtil";
import { importCorpus } from "@/impexp/corpusImporter";
import { exportMeaningClassifications } from "@/impexp/meaningClassificationsExporter";
import { importMeaningIndex } from "@/impexp/meaningIndexImporter";
import Meaning from "@/impexp/types/Meaning";
import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { isUtteranceNormalized } from "./utteranceUtil";
import { endSection, log, setStatus, startSection } from "@/common/describeLog";
import { makeUtteranceReplacements } from '@/replacement/replaceUtil';
import { doMatchWordsMatchUtterance } from "@/meaningMaps/matchUtil";
import { evaluateMeaningMatch } from "./promptEvaluateMeaningMatch";
import { findBestMeaningMatch } from "./promptFindBestMeaningMatch";
import { findMatchingNShotResponse } from "./nShotUtil";

function _findTopLevelMeaningIds(meaningIndex:MeaningIndex):string[] {
  return Object.keys(meaningIndex).filter(id => id !== UNCLASSIFIED_MEANING_ID && id.indexOf('.') === -1);
}

function _findChildMeaningIds(meaningId:string, meaningIndex:MeaningIndex):string[] {
  if (meaningId === UNCLASSIFIED_MEANING_ID) return _findTopLevelMeaningIds(meaningIndex);
  const meaning = meaningIndex[meaningId];
  assertNonNullable(meaning, `${meaningId} not found in meaningIndex.`);
  return meaning.childMeaningIds;
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
  /* v8 ignore next */
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
        const meaningEval = await evaluateMeaningMatch(utterance, meaning);
        log(`${_describeMeaningId(meaningIndex, meaningId)} evaluated to ${meaningEval}.`);
        evals.push(meaningEval);
      };
    endSection();

    evalMeaningIds = _findMeaningIdsShortList(evalMeaningIds, evals);
    if (!evalMeaningIds.length) { log(`All child meanings rejected - returning parent ${_describeMeaningId(meaningIndex, parentMeaningId)}.`); return parentMeaningId; }
    if (evalMeaningIds.length === 1) { log(`Only one child meaning candidate - ${evalMeaningIds[0]}`); return await _classifyUtteranceRecursively(utterance, meaningIndex, evalMeaningIds[0]); }

    startSection(`Directly comparing the following ${evalMeaningIds.length} candidate meanings: ${evalMeaningIds.join(', ')}.`);
      const bestMeaningId = await findBestMeaningMatch(utterance, meaningIndex, evalMeaningIds);
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
    const response = findMatchingNShotResponse(replacedUtterance, unclassifiedMeaning.nShotPairs);
    if (response === 'Y') { log('Matched unclassified n-shot - returning #0.'); return UNCLASSIFIED_MEANING_ID; }
  }
  return await _classifyUtteranceRecursively(replacedUtterance, meaningIndex, UNCLASSIFIED_MEANING_ID);  
}

type UpdateClassificationCallback = (classifications:MeaningClassifications) => void;

export async function classify(corpus:string[], meaningIndex:MeaningIndex, onUpdateClassification?:UpdateClassificationCallback):Promise<MeaningClassifications> {
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
      if (onUpdateClassification) onUpdateClassification(classifications);
    }
  endSection();
  return classifications;
}

/* v8 ignore start */
export async function createMeaningClassification(corpusFilepath:string, meaningIndexFilepath:string, classificationFilepath:string) {
  const corpus = await importCorpus(corpusFilepath);
  const meaningIndex = await importMeaningIndex(meaningIndexFilepath);
  await classify(corpus, meaningIndex, classifications => exportMeaningClassifications(classifications, classificationFilepath, meaningIndex));
}
/* v8 ignore end */

export function countUtterances(meaningIds:string[], classifications:MeaningClassifications):number {
  let total = 0;
  meaningIds.forEach(meaningId => total += classifications[meaningId].length);
  return total;
}

export function doMatchWordsMatchOtherMeanings(matchWords:string[], classifications:MeaningClassifications, excludeMeaningId:string, excludedUtterances?:Set<string>):boolean {
  const meaningIds = Object.keys(classifications).filter(meaningId => meaningId !== excludeMeaningId);
  return meaningIds.some(meaningId => {
    const utterances = classifications[meaningId];
    return utterances.some(utterance => {
      if (excludedUtterances && excludedUtterances.has(utterance)) return false;
      return doMatchWordsMatchUtterance(matchWords, utterance);
    });
  });
}