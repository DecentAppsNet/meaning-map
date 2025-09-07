import { isParam, isUtteranceNormalized, utteranceToWords } from '@/classification/utteranceUtil';
import { assert, botch } from '@/common/assertUtil';
import TryCombination from './types/TryCombination';
import WordUsageMap from './types/WordUsageMap';

function _countOns(enablements:boolean[]):number {
  let onCount = 0;
  enablements.forEach(isEnabled => { if (isEnabled) ++onCount; });
  return onCount;
}

function _enablementsToValue(wordEnablements:boolean[]) {
  let total = 0;
  for(let i = 0; i < wordEnablements.length; ++i) {
    if (wordEnablements[i]) total += Math.pow(2, i);
  }
  return total;
}

function _getInitialEnablementsForOnCount(enablementCount:number, onCount:number) {
  const enablements:boolean[] = [];
  for(let i = 0; i < enablementCount; ++i) {
    enablements[i] = i < onCount;
  }
  return enablements;
}

function _valueToEnablements(value:number, enablementCount:number):boolean[] {
  const enablements:boolean[] = [];
  for(let i = enablementCount-1; i >= 0; --i) {
    const digitValue = Math.pow(2, i);
    if (digitValue <= value) {
      enablements[i] = true;
      value -= digitValue;
    } else {
      enablements[i] = false;
    }
  }
  assert(value === 0);
  return enablements;
}

function _getNextWordEnablements(enablements:boolean[], onCount:number, stopValue:number):boolean[]|null {
  const enablementCount = enablements.length;
  let value = _enablementsToValue(enablements) + 1;
  while(value < stopValue) {
    const nextEnablements = _valueToEnablements(value, enablementCount);
    if (_countOns(nextEnablements) === onCount) return nextEnablements;
    ++value;
  }
  if (onCount === enablementCount) return null; // No more combinations exist.
  return _getInitialEnablementsForOnCount(enablementCount, onCount+1);
}

export function createFirstTryCombination(utterance:string, wordUsageMap:WordUsageMap):TryCombination {
  assert(isUtteranceNormalized(utterance) && utterance.length > 0);
  const words = utteranceToWords(utterance);
  const wordIndexes:number[] = words
    .map((w, i) => { return { word:w, index:i } }) // Retain the index so that it isn't lost in next steps.
    .filter(uw => !isParam(uw.word)) // Filter out parameters.
    .sort((a, b) => wordUsageMap[a.word].usageCount - wordUsageMap[b.word].usageCount) // Less frequently used words go to beginning.
    .map(uw => uw.index); // Return just the index.
  const wordEnablements:boolean[] = Array(wordIndexes.length).fill(false);
  const hasParams = words.some(isParam);
  if (!hasParams) wordEnablements[0] = true; // If no params, then at least one matching word will be needed.
  return { words, wordIndexes, wordEnablements };
}

export function findNextTryCombination(combination:TryCombination):TryCombination|null {
  const onCount = _countOns(combination.wordEnablements);
  const stopValue = Math.pow(2, combination.wordIndexes.length);
  const nextWordEnablements = _getNextWordEnablements(combination.wordEnablements, onCount, stopValue);
  return nextWordEnablements ? {...combination, wordEnablements:nextWordEnablements} : null;
}

export function concatMatchWords(combination:TryCombination):string[] {
  const { words, wordIndexes, wordEnablements } = combination;

  function _isEnabledWord(wordI:number) {
    for(let i = 0; i < wordIndexes.length; ++i) {
      if (wordIndexes[i] === wordI) return wordEnablements[i];
    /* v8 ignore start */
    }
    botch('combination is invalid');
    /* v8 ignore end */
  }

  const outWords:string[] = [];
  for(let outWordI = 0; outWordI < words.length; ++outWordI) {
    const word = words[outWordI];
    if (isParam(word)) { outWords.push(word); continue; }
    if (_isEnabledWord(outWordI)) outWords.push(word);
  }
  return outWords;
}