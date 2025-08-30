import { makeReplacements, TextReplacement } from '../common/stringUtil';
import SentenceToken from './types/SentenceToken';
import TokenSpan from './types/TokenSpan';
import { combineAdjacentAndOverlappingTokenSpans } from './spanUtil';
import { findPrenominalModifiers, getSentenceTokens, combineConjunctionConnectedNounGroups } from './sentenceUtil';
import { assert } from '../common/assertUtil';
import { getPackableSet } from '@/datasets/datasetUtil';

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

export async function replaceItems(sentence:string):Promise<string> {
  const sentenceTokens:SentenceToken[] = getSentenceTokens(sentence);
  const replacements:TextReplacement[] = await _findItemReplacements(sentenceTokens);
  return makeReplacements(sentence, replacements);
}