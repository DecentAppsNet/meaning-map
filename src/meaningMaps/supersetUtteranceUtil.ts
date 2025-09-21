/*
There is one edge case that is complicated enough to handle that it deserves its own module.

In a classification, we can have two utterances classified under two different meaning IDs:

  "i love you" -> meaning ID #1
  "i love you falling into a pit of spikes" -> meaning ID #2

When creating a meaning map, there is logic that chooses a set of match words for a given
utterance that won't also match to a different utterance with a different meaning. It works
great until every word of one utterance ("Subset Utterance") is also in a different-meaning 
utterance ("Superset Utterance") such that there are no combination of match words in the
Subset Utterance that won't also potentially match to the Superset Utterance.

In the example above, any combination of match words from the first utterance ("i", "love", 
"you", "i love", "love you", "i you", "i love you") will match the utterance "i love you 
falling into a pit of spikes" which has a totally different meaning.

The algorithm in this module tries to find extra match words for the Superset Utterance that
will allow that utterance to be reliably matched. So maybe we generate rules like:

  "love","you" -> meaning ID #1
  "love","you","falling" -> meaning ID #2

At least one extra word is added to the rule for the Superset Utterance that won't be
found in the Subset Utterance.

And to complicate it further, I have to deal with many-to-many Subsets and Supersets, e.g.

  "i love you" -> meaning ID #1
  "i love you falling into a pit of spikes" -> meaning ID #2
  "i love falling down" -> meaning ID #3
  "i love a good pit of spikes" -> meaning ID #4

To keep this code from degenerating into a "fix one more edge case" sprawl that becomes 
unmaintainable, I need to write code based on premises that will be known to always be true.

* all utterances in the classification are unique
* the meaning map passed to the algorithm will only contain rules that match to the
  meaning ID for the utterance they were generated for.
* each rule of this passed-in meaning map will not interfere with the matching of other rules. in 
  other words, rules will not over-match, at least in the scope of utterances represented
  by the meaning map.
* adding an extra match word to a rule will never cause over-matching, because adding 
  a match word only causes the rule to match more specifically.
* every Superset Utterance must have at least one word that is not included within a 
  Subset Utterance. I know this is true because all utterances in the classification are 
  unique and a superset must have more words than its subset.
* therefore, it should always be possible to devise a set of match words for a Superset
  Utterance that distinguishes it from any combination of Subset Utterances.
* Subset to Superset loops are impossible (A -> B, B -> C, C -> A) because a superset 
  contains ALL words in the subset, not just a portion. So no superset can be the 
  subset of an earlier subset in the chain, even transitively. If A -> B and B -> C, C must 
  contain all the words in A, so it can only be a superset of A and never a subset.
  
*/
import { assert, assertNonNullable } from "@/common/assertUtil"
import { isValidUtterance, utteranceToWords } from "@/classification/utteranceUtil"
import MeaningClassifications from "@/impexp/types/MeaningClassifications"
import { doMatchWordsMatchUtterance, matchMeaningForReplacedUtterance } from "./matchUtil"
import WordUsageMap from "@/classification/types/WordUsageMap"
import Subset from "./types/Subset"
import Superset from "./types/Superset"
import MeaningMatch from "./types/MeaningMatch"
import MeaningMap from "@/impexp/types/MeaningMap"
import { addRule, updateRuleMatchWords } from "./ruleOperationsUtil"
import RuleReference from "./types/RuleReference"
import TryCombination from "./types/TryCombination"
import { concatMatchWords, createFirstTryCombination, findNextTryCombination } from "./tryCombinationUtil"
import { doMatchWordsMatchOtherMeanings } from "@/classification/classifyUtil"

type SupersetWord = {
  word:string,
  index:number, // Position of word within full superset utterance.
  includes:boolean[],
  includeCount:number,
  adding:boolean
}

function _subsetsToSupersets(subsets:Subset[], meaningMap:MeaningMap):Superset[] {
  const uniqueSupersetUtterances:Set<string> = new Set<string>();
  subsets.forEach(subset => subset.supersetUtterances.forEach(su => uniqueSupersetUtterances.add(su)));
  return Array.from(uniqueSupersetUtterances).map(supersetUtterance => {
    const referencingSubsets = subsets.filter(subset => subset.supersetUtterances.includes(supersetUtterance));
    const subsetUtterances = referencingSubsets.map(rs => rs.utterance);
    const match:MeaningMatch|null = matchMeaningForReplacedUtterance(supersetUtterance, meaningMap);
    const ruleReference:RuleReference|null = match ? match.ruleReference : null;
    return { utterance:supersetUtterance, ruleReference, subsetUtterances };
  });
}

function _supersetToWords(superset:Superset):SupersetWord[] {
  const words = utteranceToWords(superset.utterance);
  const subsetCount = superset.subsetUtterances.length;
  const supersetWords = words.map((word, index) => (
    {word, index, includes:new Array(subsetCount).fill(false), includeCount:0, adding:false})
  );
  const subsetWords = superset.subsetUtterances.map(subsetUtterance => utteranceToWords(subsetUtterance));
  for(let wordI = 0; wordI < supersetWords.length; ++wordI) {
    const supersetWord = supersetWords[wordI];
    for(let subsetI = 0; subsetI < subsetCount; ++subsetI) {
      if (subsetWords[subsetI].includes(supersetWord.word)) {
        supersetWord.includes[subsetI] = true;
        supersetWord.includeCount++;
      }
    }
  }
  return supersetWords;
}

export function findAllSupersetUtterances(utterance:string, classifications:MeaningClassifications):string[] {
  const meaningIds = Object.keys(classifications);
  const matchWords = utteranceToWords(utterance);
  const supersetUtterances:string[] = [];
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(otherUtterance => {
      if (otherUtterance !== utterance && doMatchWordsMatchUtterance(matchWords, otherUtterance)) supersetUtterances.push(otherUtterance);
    });
  });
  return supersetUtterances;
}

function _primarySecondarySort(primaryDelta:number, secondaryDelta:number, secondaryRange:number):number {
  const secondaryCapped = Math.min(Math.abs(secondaryDelta), secondaryRange) * Math.sign(secondaryDelta);
  return primaryDelta * secondaryRange + secondaryCapped;
}

function _sortSupersetWordsByExclusivityAndUsage(supersetWords:SupersetWord[], wordUsageMap:WordUsageMap) {
  const secondaryRange = Object.keys(wordUsageMap).length; // Impossible for a word to be more frequently used than this.
  supersetWords.sort((a, b) => _primarySecondarySort(
      a.includeCount - b.includeCount, // First, favor words that are included in less subsets, ideally 0.
      wordUsageMap[a.word].usageCount - wordUsageMap[b.word].usageCount, // Second, favor words less frequently used across the corpus.
      secondaryRange));
}

function _addDistinguishingWordsToSupersetRule(words:SupersetWord[], superset:Superset, meaningMap:MeaningMap) {
  assertNonNullable(superset.ruleReference);
  const originalMatchWords = [superset.ruleReference.firstWord, ...superset.ruleReference.rule.followingWords];
  words.sort((a, b) => a.index - b.index); // Put words back in utterance order.
  let originalI = 0;
  for(let wordI = 0; wordI < words.length; ++wordI) {
    const supersetWord = words[wordI];
    if (supersetWord.adding) continue;
    if (supersetWord.word === originalMatchWords[originalI]) {
      supersetWord.adding = true;
      ++originalI;
    }
  }
  const nextMatchWords = words.filter(w => w.adding).map(w => w.word);
  updateRuleMatchWords(superset.ruleReference, nextMatchWords, meaningMap);
}

/* "Distinguished" means that the matching rule for a superset's utterance contains unique match words that
 aren't present in any of the subset utterances. */
function _distinguishSuperset(superset:Superset, wordUsageMap:WordUsageMap, meaningMap:MeaningMap) {
  const supersetWords:SupersetWord[] = _supersetToWords(superset);
  _sortSupersetWordsByExclusivityAndUsage(supersetWords, wordUsageMap);
  const subsetCount = superset.subsetUtterances.length;
  const excluded:boolean[] = new Array(subsetCount).fill(false);
  for(let supersetWordI = 0; supersetWordI < supersetWords.length; ++supersetWordI) {
    const supersetWord = supersetWords[supersetWordI];
    for(let subsetI = 0; subsetI < subsetCount; ++subsetI) {
      if (!excluded[subsetI] && !supersetWord.includes[subsetI]) {
        excluded[subsetI] = true;
        supersetWord.adding = true;
      }
    }
    if (excluded.every(isSubsetExcluded => isSubsetExcluded)) break;
  }
  assert(excluded.every(isSubsetExcluded => isSubsetExcluded), 'why was a superset not distinguishable?'); // According to my premises at top of module, they should always be distinguishable.
  _addDistinguishingWordsToSupersetRule(supersetWords, superset, meaningMap);
}

function _addRuleForSubset(subset:Subset, classifications:MeaningClassifications, distinguishedSupersetUtterances:Set<string>, wordUsageMap:WordUsageMap, meaningMap:MeaningMap) {
  const { utterance, meaningId } = subset;
  assert(isValidUtterance(utterance));
  assert(subset.supersetUtterances.every(su => distinguishedSupersetUtterances.has(su)), `not all supersets of subset "${utterance}" were distinguished.`);
  let tryCombination:TryCombination|null = createFirstTryCombination(utterance, wordUsageMap);
  let matchWords:string[] = [];
  while(tryCombination) {
    matchWords = concatMatchWords(tryCombination);
    if (!doMatchWordsMatchOtherMeanings(matchWords, classifications, meaningId, distinguishedSupersetUtterances)) break;
    tryCombination = findNextTryCombination(tryCombination);
  }
  assertNonNullable(tryCombination, 'no combination of match words worked'); // See premises at top of file. Subset was originally blocked by supersets, yet those have been distinguished, and nothing else should block.
  addRule(matchWords, meaningId, meaningMap);
  return true;
}

function _addRulesForSubsets(subsets:Subset[], classifications:MeaningClassifications, distinguishedSupersetUtterances:Set<string>, wordUsageMap:WordUsageMap, meaningMap:MeaningMap) {
  for(let i = 0; i < subsets.length; ++i) {
    const subset = subsets[i];
    console.log({subset});
    if (subset.supersetUtterances.some(su => !distinguishedSupersetUtterances.has(su))) continue; // Need to distinguish at least one superset before rules can be added.
    _addRuleForSubset(subset, classifications, distinguishedSupersetUtterances, wordUsageMap, meaningMap);    
  }
}

function _findSubsetsForUtterances(utterances:string[], subsets:Subset[]):Subset[] {
  return subsets.filter(s => utterances.includes(s.utterance));
}

/**
 * Resolve subset utterances by distinguishing their supersets first and then adding rules for the subsets.
 *
 * For a collection of `subsets` that could not initially receive match rules (because every possible
 * rule for a subset also matched one or more superset utterances), this function iteratively processes
 * the related supersets, ensures each superset's rule gets distinguishing match words, and then adds rules
 * for any subset whose supersets have been distinguished. The function mutates `meaningMap` by
 * adding/updating match rules as required.
 *
 * Preconditions:
 * - Each `Subset.utterance` should appear in `classifications`.
 * - The provided `meaningMap` should be a valid meaning map appropriate for the classification set.
 *
 * Side effects:
 * - `meaningMap` is modified (new match rules may be added and superset rules may be updated).
 *
 * @param subsets - Array of subset descriptors that need rules added once their supersets are distinguished.
 * @param classifications - Map of meaningId -> utterances used to locate subsets/supersets.
 * @param wordUsageMap - Word frequency/usage map used to pick distinguishing words for supersets.
 * @param meaningMap - The meaning map to update; this function mutates it in-place.
 */
export function resolveSubsets(subsets:Subset[], classifications:MeaningClassifications, wordUsageMap:WordUsageMap, meaningMap:MeaningMap) {
  const supersets = _subsetsToSupersets(subsets, meaningMap);
  const supersetQueue:Superset[] = [...supersets];
  const distinguishedSupersetUtterances:Set<string> = new Set<string>;
  let iterationsWithoutPop = 0;
  while(supersetQueue.length > 0 && iterationsWithoutPop < supersetQueue.length) {
    ++iterationsWithoutPop;
    const superset = supersetQueue[supersetQueue.length-1];
    if (!superset.ruleReference) { // No match rule has been created yet for this superset yet because it is also a subset.
      assert(subsets.find(s => s.utterance === superset.utterance) !== undefined, `superset doesn't have a rule but isn't represented in subsets.`); 
      // There is a chain like A -> B -> C where the utterance B (`superset` var in this loop) is a superset of A, and
      // C is a superset of B. A and B don't have a rule yet because they are subsets. When C is distinguished (has unique match word(s)
      // added to it), B will get a rule created, and then B can be distinguished allowing A to get a rule created.
      continue; 
    }
    supersetQueue.pop();
    iterationsWithoutPop = 0;
    _distinguishSuperset(superset, wordUsageMap, meaningMap);
    distinguishedSupersetUtterances.add(superset.utterance);
    const eligibleSubsets = _findSubsetsForUtterances(superset.subsetUtterances, subsets);
    _addRulesForSubsets(eligibleSubsets, classifications, distinguishedSupersetUtterances, wordUsageMap, meaningMap);
  }
}