/*
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

The code in this module supports the following alg for generating a meaning map:

  Create an index of all Subsets and their associated Supersets.

  For every utterance in a MeaningClassification...

    Find a minimal set of match words that don't match an utterance classified to a 
    different meaning ID. If the utterance is a Subset, then associated Superset utterances 
    will be excluded from consideration in this check.

  Add trump information to any subset/superset pairs that will favor the superset.
  
To keep this code from degenerating into a "fix one more edge case" sprawl that becomes 
unmaintainable, I need to write code based on premises that will be known to always be true.

* All utterances in the classification are unique.
* Every Superset Utterance must have at least one word that is not included within a 
  Subset Utterance.
* Therefore, it should always be possible to devise a set of match words for a Superset
  Utterance that distinguishes it from any combination of Subset Utterances.
* Subset to Superset loops are impossible (A -> B, B -> C, C -> A) because a Superset 
  contains ALL words in the Subset, not just a portion. So no Superset can be the 
  Subset of an earlier Subset in the chain, even transitively. If A -> B and B -> C, C must 
  contain all the words in A, so it can only be a Superset of A and never a Subset.
*/

import { assertNonNullable } from "@/common/assertUtil"
import { utteranceToWords } from "@/classification/utteranceUtil"
import MeaningClassifications from "@/impexp/types/MeaningClassifications"
import { doMatchWordsMatchUtterance } from "./matchUtil"
import SubsetIndex from "./types/SubsetIndex";
import Subset from "./types/Subset";
import RuleReferenceIndex from "./types/RuleReferenceIndex";
import MeaningMap from "@/impexp/types/MeaningMap";

function _findAllSupersetUtterances(meaningIds:string[], utterance:string, classifications:MeaningClassifications, excludeMeaningId:string):string[] {
  const matchWords = utteranceToWords(utterance);
  const supersetUtterances:string[] = [];
  meaningIds.forEach(meaningId => {
    if (meaningId === excludeMeaningId) return; // Only look for supersets in different-meaning classifications.
    const utterances = classifications[meaningId];
    utterances.forEach(otherUtterance => {
      if (otherUtterance !== utterance && doMatchWordsMatchUtterance(matchWords, otherUtterance)) supersetUtterances.push(otherUtterance);
    });
  });
  return supersetUtterances;
}

export function createSubsetIndex(classifications:MeaningClassifications):SubsetIndex {
  const subsetIndex:SubsetIndex = {};
  const meaningIds = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      const supersetUtterances = _findAllSupersetUtterances(meaningIds, utterance, classifications, meaningId);
      if (!supersetUtterances.length) return;
      const subsetEntry:Subset = { utterance, supersetUtterances };
      subsetIndex[utterance] = subsetEntry;
    });
  });
  return subsetIndex;
}

export function areMeaningMapTrumpsValid(meaningMap:MeaningMap):boolean {
  const positiveIds = new Set<number>;
  const negativeIds = new Set<number>;
  const entries = Object.values(meaningMap);
  entries.forEach(rules => {
    rules.forEach(rule => {
      if (rule.trumpIds) {
        rule.trumpIds.forEach(trumpId => {
          if (trumpId > 0) {
            if (positiveIds.has(trumpId)) {
              console.error(`trump ID ${trumpId} used multiple times.`);
              return false;
            }
            positiveIds.add(trumpId);
          } else if (trumpId < 0) {
            if (negativeIds.has(trumpId)) {
              console.error(`trump ID ${trumpId} used multiple times.`);
              return false;
            }
            negativeIds.add(trumpId);
          } else {
            console.error('trump ID for rule should not be 0');
            return false;
          }
        })
      }
    });
  });
  // Check that every element of positive IDs has a matching negative ID.
  for(const positiveId of positiveIds) {
    if (!negativeIds.has(-positiveId)) {
      console.error(`trump ID ${positiveId} has no matching negative ID.`);
      return false;
    }
  }
  // Check that every element of negative IDs has a matching positive ID.
  for(const negativeId of negativeIds) {
    if (!positiveIds.has(-negativeId)) {
      console.error(`trump ID ${negativeId} has no matching positive ID.`);
      return false;
    }
  }
  return true;
}

// NEXT here's the problem. A superset must still beat a subset even if the subset has more match words.
// To fix it:
// #1
// Create trump IDs unless superset has more match words than subset.
// In matching, when comparing A (best scoring rule) to B (loop eval rule),
// if A is subset of B, change to B.
// I think this handles chains. I think this handles a non-subset/superset C that still has
// a better score than B. C couldn't have been encountered prior to B or it would have won
// over A. And if encountered after B, then C should win.
export function addTrumpsForSubsetsAndSupersets(subsetIndex:SubsetIndex, ruleReferenceIndex:RuleReferenceIndex):void {
  let trumpId = 1;
  const subsets = Object.values(subsetIndex);
  subsets.forEach(subset => {
    subset.supersetUtterances.forEach(supersetUtterance => {
      assertNonNullable(ruleReferenceIndex[subset.utterance]);
      assertNonNullable(ruleReferenceIndex[supersetUtterance]);
      const subsetRule = ruleReferenceIndex[subset.utterance].rule;
      const supersetRule = ruleReferenceIndex[supersetUtterance].rule;
      if (subsetRule.followingWords.length >= supersetRule.followingWords.length) { // Trump IDs only needed if subset could otherwise win with higher match score.
        if (!subsetRule.trumpIds) subsetRule.trumpIds = [];
        subsetRule.trumpIds.push(-trumpId);
        if (!supersetRule.trumpIds) supersetRule.trumpIds = [];
        supersetRule.trumpIds.push(trumpId);
        trumpId++;
      }
    });
  });
}