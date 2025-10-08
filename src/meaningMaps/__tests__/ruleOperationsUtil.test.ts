import { describe, it, expect } from 'vitest';
import { removeRule, addRule, updateRuleMatchWords } from '../ruleOperationsUtil';
import MeaningMapRule from '@/impexp/types/MeaningMapRule';
import RuleReference from '../types/RuleReference';
import MeaningMap from '@/impexp/types/MeaningMapOld';

describe('ruleOperationsUtil', () => {
  describe('removeRule()', () => {
    it('removes an existing rule for the given firstWord and deletes the key when no rules remain', () => {
      const rule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1.1' };
      const mm:MeaningMap = { add: [rule] };
      const ref:RuleReference = { firstWord: 'add', rule };
      removeRule(ref, mm);
      expect(mm).toEqual({}); // key should be removed when there are no remaining rules
    });

    it('removes a single rule but leaves other rules for the same firstWord', () => {
      const removed:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1.1' };
      const remaining:MeaningMapRule = { followingWords: ['ITEMS','to'], meaningId: '1.1' };
      const mm:MeaningMap = { add: [removed, remaining] };
      removeRule({ firstWord: 'add', rule: removed }, mm);
      expect(mm.add).toEqual([remaining]);
    });

    it('throws when first word not present', () => {
      const rule:MeaningMapRule = { followingWords: [], meaningId: 'x' };
      const mm:MeaningMap = {};
      expect(() => removeRule({ firstWord: 'nope', rule }, mm)).toThrow();
    });

    it('throws when first word is present but rule reference does not match any existing rule in meaning map', () => {
      const rule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1.1' };
      const mm:MeaningMap = { add: [rule] };
      expect(() => removeRule({ firstWord: 'add', rule: { followingWords: ['to'], meaningId: '1.1' } }, mm)).toThrow();
    });
  });

  describe('addRule()', () => {
    it('adds rule to empty meaningMap for firstWord', () => {
      const matchWords = ['add', 'to', 'NUMBER'];
      const rule:MeaningMapRule = { followingWords: ['to','NUMBER'], meaningId: '1.2' };
      const mm:MeaningMap = {};
      addRule(matchWords, '1.2', mm);
      expect(mm.add).toEqual([rule]);
    });

    it('adds rule to existing firstWord', () => {
      const matchWords = ['add', 'to', 'NUMBER'];
      const existing:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1.1' };
      const rule:MeaningMapRule = { followingWords: ['to', 'NUMBER'], meaningId: '1.2' };
      const mm:MeaningMap = { add: [existing] };
      addRule(matchWords, '1.2', mm);
      expect(mm.add).toEqual([existing, rule]);
    });

    it('does not add duplicate rules', () => {
      const matchWords = ['add', 'to', 'NUMBER'];
      const existing:MeaningMapRule = { followingWords: ['to','NUMBER'], meaningId: '1.2' };
      const mm:MeaningMap = { add: [existing] };
      addRule(matchWords, '1.2', mm);
      expect(mm.add).toEqual([existing]);
    });
  });

  describe('updateRuleMatchWords()', () => {
    it('updates followingWords when firstWord is unchanged', () => {
      const originalRule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1' };
      const originalRef:RuleReference = { firstWord: 'add', rule: originalRule };
      const mm:MeaningMap = { add: [originalRule] };
      updateRuleMatchWords(originalRef, ['add','ITEMS','to','NUMBER'], mm);
      expect(mm.add).toEqual([{ followingWords: ['ITEMS','to','NUMBER'], meaningId: '1' }]);
    });

    it('moves rule to new firstWord when firstWord changes', () => {
      const originalRule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1' };
      const originalRef:RuleReference = { firstWord: 'add', rule: originalRule };
      const mm:MeaningMap = { add: [originalRule] };
      updateRuleMatchWords(originalRef, ['insert','ITEMS','to','NUMBER'], mm);
      expect(mm).toEqual({
        insert: [{ followingWords: ['ITEMS','to','NUMBER'], meaningId: '1' }]
      });
    });

    it('throws when the original rule reference matches by first word, but not an existing rule', () => {
      const originalRule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1' };
      const originalRef:RuleReference = { firstWord: 'add', rule: originalRule };
      const mm:MeaningMap = { add: [] }; // Original rule not present in meaning map
      expect(() => updateRuleMatchWords(originalRef, ['add','ITEMS','to','NUMBER'], mm)).toThrow();
    });

    it('throws when the original rule reference first word does not exist in meaning map', () => {
      const originalRule:MeaningMapRule = { followingWords: ['ITEMS'], meaningId: '1' };
      const originalRef:RuleReference = { firstWord: 'add', rule: originalRule };
      const mm:MeaningMap = {}; // Original rule not present in meaning map
      expect(() => updateRuleMatchWords(originalRef, ['add','ITEMS','to','NUMBER'], mm)).toThrow();
    });
  
  });
});
