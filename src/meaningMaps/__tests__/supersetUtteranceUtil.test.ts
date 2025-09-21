import { describe, it, expect } from 'vitest';
import { findAllSupersetUtterances, resolveSubsets } from '../supersetUtteranceUtil';
import MeaningClassifications from '@/impexp/types/MeaningClassifications';
import MeaningMap from '@/impexp/types/MeaningMap';
import MeaningMapRule from '@/impexp/types/MeaningMapRule';
import Subset from '../types/Subset';
import { generateWordUsageMap } from '@/classification/wordUsageUtil';

describe('supersetUtteranceUtil', () => {
  describe('findAllSupersetUtterances()', () => {
    it('returns empty array when no supersets', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER']
      };
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual([]);
    });

    it('finds one superset utterance', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER'],
        '2.1': ['add ITEMS to NUMBER in the list']
      };
      const expected = ['add ITEMS to NUMBER in the list'];
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual(expected);
    });

    it('finds multiple superset utterances', () => {
      const utterance = 'add ITEMS to NUMBER';
      const classifications:MeaningClassifications = {
        '1.1': ['add ITEMS to NUMBER'],
        '2.1': ['add ITEMS to NUMBER in the list', 'please add ITEMS to NUMBER in the list'],
        '3.1': ['add ITEMS to NUMBER now']
      };
      const expected = [
        'add ITEMS to NUMBER in the list', 
        'please add ITEMS to NUMBER in the list', 
        'add ITEMS to NUMBER now'
      ];
      const out = findAllSupersetUtterances(utterance, classifications);
      expect(out).toEqual(expected);
    });
  });

  /*
  You are struggling to contrive a test that matches reality.

  The original 1st-pass logic is going to give the superset match words that do not
  match to other meanings. So it wouldn't give it a rule like "love" -> 2 (undistinguished). It would give it
  a rule like "falling" -> 2 (distinguished). So while the current algorithm is not going to generate mismatches 
  by finding an extra distinguishing word, it will overfit the superset matching words.

  You could probably just simplify the whole thing to keeping a processing queue of postponed subset utterances and running
  through them with as many loops as needed to empty queue. Each loop iteration would try again to create a rule for the subset 
  utterance with the understanding that a superset that has a rule can already be considered distinguished. I'm fairly certain this
  is correct and would allow me to delete most of the supersetUtteranceUtil.ts code.

  The one thing remaining to handle with the above approach is tie-breaking correctly when both subset and superset have same
  number of match words and potentially score the same. So imagine this meaning map:

  "love" -> 1
  "falling" -> 2

  And then the user says "i love you falling in a pit". Both rules will score equally and a mismatch to 1 is possible.

  Ways to fix this:
  #1 add an extra match word to superset so it scores higher. 
    con: overfitting
    pro: understandable meaning maps, avoid special-case code in finding matches
  #2 add a score bump to the MeaningMapRule structure and set it for rules that point to supersets. 
    con: control over behavior relative to other rules might get unpredictable/tweaky
  #3 add a isSuperset member to the MeaningMapRule structure and use it to signal score bump. 
    cons: same as previous--lack of control. 
          Also, "isSuperset" doesn't lend itself to understanding in context of a rule. 
    pro: (compared to previous) scoring behavior not coupled to data
  #4 add a tieBreakMeaningIDs:string[] member to the MeaningMapRule structure and set it for rules that point to supersets. 
    Then whenever there is a score tie with a rule in a designated meaning ID, the superset rule will win.
    con: slightly complex to understand in meaningMap.
    pro: more controlled behavior than preceding options, though maybe it is too broad to specify a meaning ID that covers all rules within a meaning ID.
    Suppose this kind of meaning map:

    "love" -> 1                               from "i love you" subset
    "falling" -> 2 (tie break against 1).     from "i love you falling in a pit" superset of previous utterance
    "not" -> 1 (tie break against 2).         from "i love you not falling in a pit" superset of previous utterance

    "i love you" matches to 1.
    "i love you falling in a pit" matches to both 1 and 2, and tie breaks to 2.
    "i love you not falling in a pit" matches to 1.

    That actually works fine. Having difficulty contriving an example that breaks the intent of matching rules. But can I prove that no case would exist?

  #5 add ruleID:number and tieBreakRuleIds:number[] to meaning map, and set it for rules that point to supersets. Then whenever
    there is a scoring tie between a subset-created rule and its corresponding superset-created rule, the superset rule wins.
    pros: you will definitely have complete control of tie breaking with no unintended consequences.
         simplifies some code that uses RuleReference, where a rule ID could be used instead.
    con: complicates the meaningMap data structure and the code the operates on the meaning map.
  
  #6 add optional "tieBreakIds:number[]" where a positive number indicates winning and a negative number indicates losing, and the absolute value of the number is a
    unique "tie break ID" identifying both rules that participate in the tie break.
    pros: again, complete control of the tie breaking with no unintended consequences.
    con: complicates the meaningMap data structure and operating code a bit, though not as bad as previous option.
  */
  describe('resolveSubsets()', () => {
    it('resolves one subset with one superset', () => {
      const classifications:MeaningClassifications = {
        '1':['i love you'],
        '2':['i love you falling in a pit']
      };
      const wordUsageMap = generateWordUsageMap(classifications);
      const meaningMap:MeaningMap = {
        love:[{followingWords:[], meaningId:'2'}]
      };
      const subsets:Subset[] = [
        {utterance:'i love you', meaningId:'1', supersetUtterances:['i love you falling in a pit']}
      ];
      resolveSubsets(subsets, classifications, wordUsageMap, meaningMap);
      console.log(JSON.stringify(meaningMap));
    });
  });
});