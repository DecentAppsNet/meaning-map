/* Utterances are text collected from speech recognition. They can be normalized for faster processing.
   When they are templatized they can contain parameters as all-caps words.

   Example utterances:

    uh hello
    the quick brown fox jumped over the lazy dog
    i want to know tell me now
    add NUMBER to NUMBER2 and you get NUMBER3
*/
import { assert } from '@/common/assertUtil';
import { isDigitChar } from '@/common/regExUtil';

function _findBaseParamName(paramName:string):string {
  let firstNonNumeric = paramName.length - 1;
  while(firstNonNumeric > 0 && isDigitChar(paramName[firstNonNumeric])) --firstNonNumeric;
  assert(firstNonNumeric !== -1); // e.g. paramName was "3" or "".
  return paramName.slice(0, firstNonNumeric+1);
}

export function isParam(word:string):boolean {
  return word.toUpperCase() === word;
}

export function isMatchingParam(word:string, baseParamName:string):boolean {
  if (word.toUpperCase() !== word) return false;
  return baseParamName === _findBaseParamName(word);
}

// All caps words signify variable insertion points.
function _normalizeWord(word:string):string {
  if (word.length > 1 && isParam(word)) return word;
  return word.toLowerCase();
}

export function normalizeUtterance(utterance:string):string {
  return utterance
    .split(/\s+/)
    .map(word => _normalizeWord(word))
    .filter(s => s.length > 0)
    .join(' ');
}

export function utteranceToWords(utterance:string):string[] {
  assert(isValidUtterance(utterance));
  return utterance.split(' ');
}

export function wordsToUtterance(words:string[]):string {
  assert(words.length > 0); // Or it won't form a valid utterance.
  return words.join(' ');
}

export function isUtteranceNormalized(utterance:string):boolean {
  return normalizeUtterance(utterance) === utterance;
}

export function isValidUtterance(utterance:string):boolean {
  return utterance.length > 0 && isUtteranceNormalized(utterance);
}

export function isPlainUtterance(utterance:string):boolean {
  if (!isValidUtterance(utterance)) return false;
  const words = utterance.split(' ');
  return !words.some(isParam);
}

export function findParamsInUtterance(utterance:string):string[] {
  assert(isValidUtterance(utterance));
  const words = utterance.split(' ');
  return words.filter(isParam);
}