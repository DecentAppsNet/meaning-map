import { makeReplacements, TextReplacement } from '../common/stringUtil';
import SentenceToken from '../sentenceParsing/types/SentenceToken';
import TokenSpan from '../sentenceParsing/types/TokenSpan';
import { combineAdjacentAndOverlappingTokenSpans } from '../sentenceParsing/spanUtil';
import { findPrenominalModifiers, getSentenceTokens, combineConjunctionConnectedNounGroups } from '../sentenceParsing/sentenceUtil';
import { assert } from '../common/assertUtil';
import { getPackableSet } from '@/impexp/datasetUtil';
import { isMatchingParam, isParam, isValidUtterance, utteranceToWords, wordsToUtterance } from '@/sentenceParsing/utteranceUtil';
import ReplacedValues from './types/ReplacedValues';
import Replacer from './types/Replacer';
import numberReplacer from './replaceNumbers';

async function _mightBeAPhysicalObject(value:string, partOfSpeech:string):Promise<boolean> {
  if (partOfSpeech !== 'NOUN') return false; // TODO remove this once packables.txt is finished being generated.
  assert(value.toLowerCase() === value, 'Expected lowercase noun');
  const packables = await getPackableSet();
  return packables.has(value);
}

async function _findItemReplacements(sentenceTokens:SentenceToken[]):Promise<TextReplacement[]> {
  let nounGroups:TokenSpan[] = [];
  for(let i = 0; i < sentenceTokens.length; ++i) {
    const { value, partOfSpeech } = sentenceTokens[i];
    if (!await _mightBeAPhysicalObject(value, partOfSpeech)) continue;
    let firstI = findPrenominalModifiers(sentenceTokens, i);
    nounGroups.push({firstI, lastI:i});
  }
  if (!nounGroups.length) return [];

  nounGroups = combineAdjacentAndOverlappingTokenSpans(nounGroups);
  nounGroups = combineConjunctionConnectedNounGroups(sentenceTokens, nounGroups);

  return nounGroups.map((nounGroup, itemNo) => {
    const fromPos = sentenceTokens[nounGroup.firstI].fromPos;
    const toPos = sentenceTokens[nounGroup.lastI].toPos;
    const replacementText = itemNo === 0 ? 'ITEMS' : `ITEMS${itemNo+1}`;
    return {fromPos, toPos, replacementText};
  });
}

function _replacementsToValues(originalUtterance:string, replacements:TextReplacement[]):ReplacedValues {
  const replacedValues:ReplacedValues = {};
  replacements.forEach(replacement => {
    const { fromPos, toPos, replacementText } = replacement;
    assert(isParam(replacementText));
    assert(fromPos >= 0 && fromPos <= originalUtterance.length);
    assert(toPos > fromPos && toPos <= originalUtterance.length);
    replacedValues[replacementText] = originalUtterance.substring(fromPos, toPos);
  });
  return replacedValues;
}

export async function replaceItems(utterance:string):Promise<[replacedUtterance:string, replacedValues:ReplacedValues]> {
  assert(isValidUtterance(utterance));
  const sentenceTokens:SentenceToken[] = getSentenceTokens(utterance);
  const replacements:TextReplacement[] = await _findItemReplacements(sentenceTokens);
  const replacedValues = _replacementsToValues(utterance, replacements);
  const replacedUtterance = makeReplacements(utterance, replacements);
  return [replacedUtterance, replacedValues];
}

export async function getItemsTextForEmbedding(replacedUtterance:string):Promise<string> {
  assert(isValidUtterance(replacedUtterance));
  const words = utteranceToWords(replacedUtterance);
  const unreplacedWords = words.map(word => {
    return isMatchingParam(word, 'ITEMS') ? 'cherry pie' : word;
  });
  return wordsToUtterance(unreplacedWords);
}

const REPLACER:Replacer = {
  id: 'ITEMS',
  precedesReplacers: [numberReplacer.id],
  onGetTextForEmbedding: getItemsTextForEmbedding,
  onReplace: replaceItems,
}

export default REPLACER;