import { assert } from '@/common/assertUtil';

export function isParam(word:string):boolean {
  return word.toUpperCase() === word;
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

export function isUtteranceNormalized(utterance:string):boolean {
  return normalizeUtterance(utterance) === utterance;
}

export function findParamsInUtterance(utterance:string):string[] {
  if (!utterance.length) return [];
  assert(isUtteranceNormalized(utterance));
  const words = utterance.split(' ');
  return words.filter(isParam);
}