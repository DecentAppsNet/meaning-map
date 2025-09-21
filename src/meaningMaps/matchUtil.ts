import { assert } from '@/common/assertUtil';
import { isPlainUtterance, isValidUtterance, utteranceToWords } from "@/classification/utteranceUtil";
import { makeUtteranceReplacements } from "@/replacement/replaceUtil";
import MeaningMatch from "./types/MeaningMatch";
import ReplacedValues from "@/replacement/types/ReplacedValues";
import MeaningMap from '@/impexp/types/MeaningMap';
import RuleReference from './types/RuleReference';

type ActiveMatch = {
  remainingWords:string[],
  ruleReference:RuleReference,
  isMatched:boolean,
  matchScore:number, // Higher is better.
}

const MATCH_WORD_SCORE_WEIGHT = 5;
const GAP_WORD_SCORE_WEIGHT = 1;

function _addActiveMatchesForFirstWord(firstWord:string, remainingEvalCount:number, meaningMap:MeaningMap, activeMatches:ActiveMatch[]) {
  const rules = meaningMap[firstWord];
  if (!rules) return null;
  for(let ruleI = 0; ruleI < rules.length; ++ruleI) {
    const rule = rules[ruleI];
    if (!rule.followingWords.length) { 
      activeMatches.push({
        remainingWords:[],  
        ruleReference:{firstWord, rule}, 
        matchScore:MATCH_WORD_SCORE_WEIGHT, 
        isMatched:true
      });
      continue;
    }
    if (rule.followingWords.length > remainingEvalCount) continue; // Impossible to match since it needs more words than are left for me to evaluate.
    activeMatches.push({
      remainingWords:[...rule.followingWords], 
      ruleReference:{firstWord, rule}, 
      matchScore:MATCH_WORD_SCORE_WEIGHT, 
      isMatched:false
    });
  }
}

function _updateActiveMatches(word:string, remainingEvalCount:number, activeMatches:ActiveMatch[]) {
  for(let i = 0; i < activeMatches.length; ++i) {
    const activeMatch = activeMatches[i];
    if (activeMatch.isMatched) continue;
    if (activeMatch.remainingWords[0] === word) {  
      activeMatch.matchScore += MATCH_WORD_SCORE_WEIGHT;
      activeMatch.remainingWords.shift();
      activeMatch.isMatched = activeMatch.remainingWords.length === 0;
    } else {
      activeMatch.matchScore -= GAP_WORD_SCORE_WEIGHT;
    }
  }
  // Cull matches that are impossible because not enough words remain to match them.
  activeMatches = activeMatches.filter(am => am.isMatched || am.remainingWords.length <= remainingEvalCount);
}

const ANYTHING_BEATS = -999999;
function _findBestMeaningMatch(activeMatches:ActiveMatch[]):ActiveMatch|null {
  let bestScore = ANYTHING_BEATS, bestActiveMatch:ActiveMatch|null = null;
  for(let i = 0; i < activeMatches.length; ++i) {
    const activeMatch = activeMatches[i];
    if (activeMatch.isMatched && activeMatch.matchScore > bestScore) {
      bestScore = activeMatch.matchScore;
      bestActiveMatch = activeMatch;
    }
  }
  return bestActiveMatch;
}

export function matchMeaningForReplacedUtterance(replacedUtterance:string, meaningMap:MeaningMap, replacedValues:ReplacedValues = {}):MeaningMatch|null {
  assert(isValidUtterance(replacedUtterance));
  const words = utteranceToWords(replacedUtterance);
  const activeMatches:ActiveMatch[] = [];
  let remainingEvalCount = words.length;
  for(let wordI = 0; wordI < words.length; ++wordI) {
    const word = words[wordI];
    _updateActiveMatches(word, remainingEvalCount, activeMatches);
    _addActiveMatchesForFirstWord(word, --remainingEvalCount, meaningMap, activeMatches);
  }
  const bestMatch = _findBestMeaningMatch(activeMatches);
  if (!bestMatch) return null; // No match found.
  return { meaningId:bestMatch.ruleReference.rule.meaningId, ruleReference:bestMatch.ruleReference, paramValues:replacedValues };
}

export async function matchMeaning(plainUtterance:string, meaningMap:MeaningMap):Promise<MeaningMatch|null> {
  assert(isPlainUtterance(plainUtterance));
  const [replacedUtterance, replacedValues] = await makeUtteranceReplacements(plainUtterance);
  return matchMeaningForReplacedUtterance(replacedUtterance, meaningMap, replacedValues);
}

export function doMatchWordsMatchUtterance(matchWords:string[], utterance:string):boolean {
  assert(isValidUtterance(utterance));
  assert(matchWords.length > 0);
  const words = utteranceToWords(utterance);
  let matchFromI = 0;
  for(let matchWordI = 0; matchWordI < matchWords.length; ++matchWordI) {
    const matchWord = matchWords[matchWordI];
    for(; matchFromI < words.length; ++matchFromI) {
      if (words[matchFromI] === matchWord) break;
    }
    if (matchFromI === words.length) return false; // The current match word couldn't be found in utterance.
    ++matchFromI; // Found current match word. Next match word should be looked for after this one.
  }
  return true; // All match words found.
}