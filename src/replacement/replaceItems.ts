import { makeReplacements, TextReplacement } from '../common/stringUtil';
import SentenceToken from '../classification/types/SentenceToken';
import TokenSpan from '../classification/types/TokenSpan';
import { combineAdjacentAndOverlappingTokenSpans } from '../classification/spanUtil';
import { findPrenominalModifiers, getSentenceTokens, combineConjunctionConnectedNounGroups } from '../classification/sentenceUtil';
import { assert } from '../common/assertUtil';
import { getPackableSet } from '@/impexp/datasetUtil';
import { isMatchingParam, isParam, isValidUtterance, utteranceToWords, wordsToUtterance } from '@/classification/utteranceUtil';
import ReplacedValues from './types/ReplacedValues';

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

// Useful for testing. Converts "ITEMS" and "ITEMSn" with placeholders that are expected to
// symmetrically be replaced back to the original values if run through replaceItems().
export function unreplaceItemsWithPlaceholders(utterance:string):string {
  const words = utteranceToWords(utterance);
  const unreplacedWords = words.map(word => {
    return isMatchingParam(word, 'ITEMS') ? 'banana' : word;
  });
  return wordsToUtterance(unreplacedWords);
}