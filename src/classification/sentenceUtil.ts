import { ItemToken } from "wink-nlp";

import { getNlp } from "./nlpUtil";
import SentenceToken from "./types/SentenceToken";
import TokenSpan from "./types/TokenSpan";
import { assert } from "../common/assertUtil";

function _getPreviousTokenPartOfSpeech(sentenceTokens:SentenceToken[], index:number):string {
  return index > 0 ? sentenceTokens[index - 1].partOfSpeech : '';
}

function _getNextTokenPartOfSpeech(sentenceTokens:SentenceToken[], index:number):string {
  return index < sentenceTokens.length - 1 ? sentenceTokens[index + 1].partOfSpeech : '';
}

function _isGerund(sentenceTokens:SentenceToken[], index:number):boolean {
  const token = sentenceTokens[index];
  const prevPartOfSpeech = _getPreviousTokenPartOfSpeech(sentenceTokens, index);
  if (prevPartOfSpeech === 'AUX' || prevPartOfSpeech === 'PROPN') return false; // e.g., "is running", "i'm running"
  const nextPartOfSpeech = _getNextTokenPartOfSpeech(sentenceTokens, index);
  if (nextPartOfSpeech !== 'NOUN' && nextPartOfSpeech !== 'PROPN') return false; // e,g, "running fast", "running the show"
  return token.partOfSpeech === 'VERB' && token.value.endsWith('ing');
}

const POSSESSIVE_PRONOUNS = new Set(['my', 'your', 'his', 'her', 'its', 'our', 'their']);
function _isPossessivePronoun(value:string):boolean {
  return POSSESSIVE_PRONOUNS.has(value);
}

// What I learned about apostrophes at the end, e.g. "Jesus' brother": Wink doesn't parse these as possessives.
// If it becomes important, a preprocessing step could convert "Jesus'" to "Jesus's" to make it work. But since
// this library is designed for speech-to-text input, I don't think any STT engine would produce that form.
function _isPossessiveParticiple(value:string):boolean {
  return value === "'s" || value === "’s";
}

function _isPossessiveNoun(sentenceTokens:SentenceToken[], index:number):boolean {
  const previousTokenPartOfSpeech = _getPreviousTokenPartOfSpeech(sentenceTokens, index);
  return _isPossessiveParticiple(sentenceTokens[index].value) 
    && index > 0 && ['NOUN', 'PROPN'].includes(previousTokenPartOfSpeech);
}

function _isPrecededByAdjective(sentenceTokens:SentenceToken[], index:number):boolean {
  return _getPreviousTokenPartOfSpeech(sentenceTokens, index) === 'ADJ';
}

function _isPrecededByNumeral(sentenceTokens:SentenceToken[], index:number):boolean {
  return _getPreviousTokenPartOfSpeech(sentenceTokens, index) === 'NUM';
}

// This can be much more complex. Consider "I put a cat in a basket" versus "I have a cat in a basket". I'm
// simplifying by only allowing a few prepositions that commonly modify nouns. But these will exclude some valid cases
// like "my bag for marbles". If you want to refine, look at the function isPlacementVerb() in verbUtil.ts, which was
// close to working well. It could be used to check the verb preceding the first noun group.
const MODIFYING_PREPOSITIONS = ['of', 'with', 'without'];
function _isConnectingPreposition(sentenceTokens:SentenceToken[], index:number):boolean {
  if (!MODIFYING_PREPOSITIONS.includes(sentenceTokens[index].value.toLowerCase())) return false;
  const previousTokenPartOfSpeech = _getPreviousTokenPartOfSpeech(sentenceTokens, index);
  return ['NOUN', 'PROPN'].includes(previousTokenPartOfSpeech);
}

const IMPOSSIBLE_MODIFIER_POS = new Set(['PUNCT', 'SCONJ', 'AUX', 'SYM', 'X', 'SPACE']);
export function findPrenominalModifiers(sentenceTokens:SentenceToken[], nounTokenI:number):number {
  // Start at the noun itself and move left to include modifiers.
  let firstI = nounTokenI - 1
  for (; firstI >= 0; --firstI) {
    const left = sentenceTokens[firstI];
    const partOfSpeech = left.partOfSpeech;

    // stop on parts of speech that can never be prenominal modifiers.
    if (IMPOSSIBLE_MODIFIER_POS.has(partOfSpeech)) break;

    // now consider all the parts of speech that may or may not be modifiers
    
    // Gerunds, e.g. "flaming sword".
    if (partOfSpeech === 'VERB' && !_isGerund(sentenceTokens, firstI)) break;
    
    // Possesive pronouns, e.g. "my", "your", "his", "her", "its", "our", "their".
    if (partOfSpeech === 'PRON' && !_isPossessivePronoun(left.value)) break;
    
    // Conjunctions between adjectives, (e.g. "long and hard winter") or numerals (e.g. "one hundred and fifty five apples").
    if (partOfSpeech === 'CCONJ' 
      && !_isPrecededByAdjective(sentenceTokens, firstI) 
      && !_isPrecededByNumeral(sentenceTokens, firstI)) break;

    // Particles that are possessive markers, e.g. "'s" or "’s" as in "Jessie's".
    if (partOfSpeech === 'PART' && !_isPossessiveNoun(sentenceTokens, firstI)) break;

    // Connecting prepositions that are preceded by a modifying noun, e.g. "bag of marbles", "sandwich with cheese".
    if (partOfSpeech === 'ADP' && !_isConnectingPreposition(sentenceTokens, firstI)) break;

    // Everything else counts as a modifier (e.g., ADJ, DET, PROPN, NOUN).
  }
  return firstI + 1;
}

export function getSentenceTokens(sentence:string):SentenceToken[] {
  const nlp = getNlp(), its = nlp.its;
  const doc = nlp.readDoc(sentence);
  const sentenceTokens:SentenceToken[] = [];
  let currentPos = 0;
  doc.tokens().each((t:ItemToken) => {
    /* v8 ignore start */ // Avoid contriving tests to cover the || '' cases, which seem anomalous.
    const type:string = t.out(its.type);
    const value:string = t.out(its.value) || '';
    const precedingSpaces:string = t.out(its.precedingSpaces) || '';
    /* v8 ignore end */
    if (type !== 'word') { // I only care about words, not punctuation or other stuff. But track position.
      currentPos += precedingSpaces.length + value.length;
      return;
    }
    /* v8 ignore next */
    const partOfSpeech:string = t.out(its.pos) || 'X';
    currentPos += precedingSpaces.length;
    const fromPos = currentPos;
    currentPos += value.length;
    const toPos = currentPos;
    sentenceTokens.push({ value, fromPos, toPos, partOfSpeech });
  });
  return sentenceTokens;
}

export function combineConjunctionConnectedNounGroups(sentenceTokens:SentenceToken[], nounGroups:TokenSpan[]):TokenSpan[] {
  if (nounGroups.length < 2) return nounGroups;

  const combinedNounGroups:TokenSpan[] = [];
  let currentGroup = nounGroups[0];
  for (let i = 1; i < nounGroups.length; ++i) {
    const nextGroup = nounGroups[i];
    
    // Are the groups separated by just one token?
    const gapCount = nextGroup.firstI - currentGroup.lastI - 1;
    assert(gapCount >= 1, 'Expected noun groups to be non-overlapping and in order');
    if (gapCount > 1) { // More than one token in between, so can't be conjunction-connected.
      combinedNounGroups.push(currentGroup);
      currentGroup = nextGroup;
      continue;
    }

    // Check the gap token to see if it's a conjunction.
    const gapToken = sentenceTokens[currentGroup.lastI + 1];
    if (gapToken.partOfSpeech !== 'CCONJ') { // Not a conjunction, so can't be conjunction-connected.
      combinedNounGroups.push(currentGroup);
      currentGroup = nextGroup;
      continue;
    }

    // It's a conjunction - extend the current group to include the next group.
    currentGroup = { firstI: currentGroup.firstI, lastI: nextGroup.lastI };
  }
  combinedNounGroups.push(currentGroup); // Add the last group.

  return combinedNounGroups;
}