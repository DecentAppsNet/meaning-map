/* Operations for updating rules in a valid meaning map. */

import { assert, assertNonNullable } from '@/common/assertUtil';
import MeaningMapRule, { areMeaningMapRulesEqual } from "@/impexp/types/MeaningMapRule";
import RuleReference from "./types/RuleReference";
import MeaningMap from "@/impexp/types/MeaningMap";

function _removeRule(ruleReference:RuleReference, meaningMap:MeaningMap) {
  const { firstWord, rule } = ruleReference;
  const rules = meaningMap[firstWord];
  assertNonNullable(rules);
  meaningMap[firstWord] = rules.filter(r => r !== rule);
  if (!meaningMap[firstWord].length) delete meaningMap[firstWord];
}

function _rulesIncludes(rules:MeaningMapRule[], checkForRule:MeaningMapRule):boolean {
  return rules.some(e => areMeaningMapRulesEqual(e, checkForRule));
}

function _rulesIncludesReference(rules:MeaningMapRule[], checkForRule:MeaningMapRule):boolean {
  return rules.some(e => e == checkForRule);
}

function _addRule(firstWord:string, rule:MeaningMapRule, meaningMap:MeaningMap) {
  const rules = meaningMap[firstWord];
  if (!rules) {
    meaningMap[firstWord] = [rule];
    return;
  }
  if (!_rulesIncludes(rules, rule)) rules.push(rule);
}

function _isRuleReferenceValid(ruleReference:RuleReference, meaningMap:MeaningMap):boolean {
  const { firstWord, rule } = ruleReference;
  const rules = meaningMap[firstWord];
  if (!rules) return false;
  return _rulesIncludesReference(rules, rule);
}

export function addRule(matchWords:string[], meaningId:string, meaningMap:MeaningMap) {
  assert(matchWords.length > 0);
  const firstWord = matchWords[0];
  const rule:MeaningMapRule = {followingWords:matchWords.slice(1), meaningId};
  _addRule(firstWord, rule, meaningMap);
}

export function removeRule(ruleReference:RuleReference, meaningMap:MeaningMap) {
  if (!_isRuleReferenceValid(ruleReference, meaningMap)) throw new Error('Rule reference does not match any existing rule in meaning map.');
  _removeRule(ruleReference, meaningMap);
}

export function updateRuleMatchWords(originalRuleReference:RuleReference, matchWords:string[], meaningMap:MeaningMap) {
  assert(matchWords.length >= 1);
  if (!_isRuleReferenceValid(originalRuleReference, meaningMap)) throw new Error('Original rule reference does not match any existing rule in meaning map.');
  const nextFirstWord = matchWords[0];
  const followingWords = matchWords.slice(1);
  if (nextFirstWord === originalRuleReference.firstWord) { // If first word is the same, just update the existing rule.
    originalRuleReference.rule.followingWords = followingWords;
    return;
  }

  // First word changed, so remove the original rule and create a new one under different first word.
  const nextRule:MeaningMapRule = { meaningId:originalRuleReference.rule.meaningId, followingWords };
  _removeRule(originalRuleReference, meaningMap);
  _addRule(nextFirstWord, nextRule, meaningMap);
}