import { makeReplacements, TextReplacement } from '../common/stringUtil';
import SentenceToken from './types/SentenceToken';
import { createNounMatchCriteria, doesNounMatchCriteria } from './wordComparisonUtil';
import TokenSpan from './types/TokenSpan';
import { combineAdjacentAndOverlappingTokenSpans } from './spanUtil';
import { findPrenominalModifiers, getSentenceTokens } from './sentenceUtil';
import VectorMatchCriteria from './types/VectorMatchCriteria';

let thePhysicalObjectCriteria:VectorMatchCriteria|null = null;

const PHYSICAL_OBJECT_CRITERIA_NOUNS = ['tool', 'device', 'instrument', 'utensil', 'appliance', 'clothing', 
  'machine', 'furniture', 'accessory', 'product', 'package', 'container', 'equipment', 'gear', 'food', 
  'camping supplies', 'cleaning supplies', 'kitchen supplies', 'office supplies', 'toiletry'];
async function _getPhysicalObjectCriteria() {
  if (!thePhysicalObjectCriteria) thePhysicalObjectCriteria = await createNounMatchCriteria(PHYSICAL_OBJECT_CRITERIA_NOUNS);
  return thePhysicalObjectCriteria;
}

// These two categories are for either reducing computation on words that come up frequently or overriding 
// incorrect vector comparisons.
const QUICK_INCLUDE_NOUNS = new Set(); 
const QUICK_EXCLUDE_NOUNS = new Set(['idea', 'thing', 'things', 'stuff', 'item', 'items', 'object', 'objects', 
  'something', 'anything', 'everything', 
  'house', 'world', 'building', 'shed', 'apartment', 'room', 'area', 'place', 'space']);

async function _mightBeAPhysicalObject(value:string, partOfSpeech:string):Promise<boolean> {
  const criteria = await _getPhysicalObjectCriteria();
  if (partOfSpeech !== 'NOUN') return false;
  /* v8 ignore next */ // This was here for "can", which actually doesn't work because Wink classifies it as AUX. But maybe other inclusion words may be valuable.
  if (QUICK_INCLUDE_NOUNS.has(value)) return true;
  if (QUICK_EXCLUDE_NOUNS.has(value)) return false;
  return await doesNounMatchCriteria(value, criteria);
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