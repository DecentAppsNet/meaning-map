import { describe, it, expect, beforeEach } from 'vitest';
import { registerReplacer, unregisterReplacer, isReplacerRegistered, getReplacers, getTextForEmbedding, paramToReplacerId, makeUtteranceReplacements } from "../replaceUtil";
import Replacer, { GetTextForEmbeddingCallback, ReplaceCallback } from '../types/Replacer';
import { disableConsoleWarn, reenableConsoleWarn } from '@/common/testUtil';

describe('replaceUtil', () => {
  const onGetTextForEmbedding:GetTextForEmbeddingCallback = async (utterance:string) => utterance;
  const onReplace:ReplaceCallback = async (utterance:string) => [utterance, {}];
      
  beforeEach(() => {
    unregisterReplacer('CUSTOM');
    unregisterReplacer('A');
    unregisterReplacer('B');
    unregisterReplacer('C');
    unregisterReplacer('D');
    unregisterReplacer('E');
  });

  describe('isReplacerRegistered()', () => {
    it('returns true for ITEMS (built-in replacer)', () => {
      expect(isReplacerRegistered('ITEMS')).toEqual(true);
    });

    it('returns true for NUMBER (built-in replacer)', () => {
      expect(isReplacerRegistered('NUMBER')).toEqual(true);
    });

    it('returns false for non-registered replacer', () => {
      expect(isReplacerRegistered('NON_EXISTENT_REPLACER')).toEqual(false);
    });

    it('returns true for custom registered replacer', () => {
      const customReplacer:Replacer = { id: 'CUSTOM', precedesReplacers: [], onGetTextForEmbedding, onReplace };
      registerReplacer(customReplacer);
      expect(isReplacerRegistered('CUSTOM')).toEqual(true);
    });
  });

  describe('registerReplacer()', () => {
    it('registers custom replacer', () => {
      const customReplacer:Replacer = { id: 'CUSTOM', precedesReplacers: [], onGetTextForEmbedding, onReplace };
      registerReplacer(customReplacer);
      expect(isReplacerRegistered('CUSTOM')).toEqual(true);
    });

    it('throws error when registering replacer with duplicate id', () => {
      const customReplacer:Replacer = { id: 'CUSTOM', precedesReplacers: [], onGetTextForEmbedding, onReplace };
      registerReplacer(customReplacer);
      expect(() => registerReplacer(customReplacer)).toThrowError();
    });
  });

  describe('paramToReplacerId()', () => {
    it('removes trailing digit from param to get replacer id', () => {
      expect(paramToReplacerId('DOG2')).toEqual('DOG');
    });

    it('removes multiple trailing digits from param to get replacer id', () => {
      expect(paramToReplacerId('DOG22')).toEqual('DOG');
    });

    it('returns same string if no trailing digit', () => {
      expect(paramToReplacerId('DOG')).toEqual('DOG');
    });
  });

  describe('getReplacers()', () => {
    it('returns empty array when no IDs passed', () => {
      const replacers = getReplacers([]);
      expect(replacers.length).toEqual(0);
    });

    it('returns built-in replacer', () => {
      const replacers = getReplacers(['NUMBER']);
      expect(replacers.length).toEqual(1);
      expect(replacers[0].id).toEqual('NUMBER');
    });

    it('returns two built-in replacers', () => {
      const replacers = getReplacers(['ITEMS', 'NUMBER']);
      expect(replacers.length).toEqual(2);
      expect(replacers[0].id).toEqual('ITEMS');
      expect(replacers[1].id).toEqual('NUMBER');
    });

    it('returns two built-in replacers in corrected sequence', () => {
      const replacers = getReplacers(['NUMBER', 'ITEMS']);
      expect(replacers.length).toEqual(2);
      expect(replacers[0].id).toEqual('ITEMS');
      expect(replacers[0].precedesReplacers).toEqual(['NUMBER']);
      expect(replacers[1].id).toEqual('NUMBER');
    });

    it('throws error for non-registered replacer', () => {
      expect(() => getReplacers(['NON_EXISTENT_REPLACER'])).toThrowError();
    });

    it('returns custom registered replacer', () => {
      const customReplacer:Replacer = { id: 'CUSTOM', precedesReplacers: [], onGetTextForEmbedding, onReplace };
      registerReplacer(customReplacer);
      const replacers = getReplacers(['CUSTOM']);
      expect(replacers.length).toEqual(1);
      expect(replacers[0].id).toEqual('CUSTOM');
    });

    it('corrects the sequence of multiple custom replacers', () => {
      const a:Replacer = { id:'A', precedesReplacers:['B'], onGetTextForEmbedding, onReplace };
      const b:Replacer = { id:'B', precedesReplacers:['C'], onGetTextForEmbedding, onReplace };
      const c:Replacer = { id:'C', precedesReplacers:['D', 'E'], onGetTextForEmbedding, onReplace };
      const d:Replacer = { id:'D', precedesReplacers:[], onGetTextForEmbedding, onReplace };
      const e:Replacer = { id:'E', precedesReplacers:[], onGetTextForEmbedding, onReplace };
      registerReplacer(a);
      registerReplacer(b);
      registerReplacer(c);
      registerReplacer(d);
      registerReplacer(e);
      const replacers = getReplacers(['A', 'E', 'B', 'D', 'C']);
      expect(replacers.length).toEqual(5);
      expect(replacers[0].id).toEqual('A');
      expect(replacers[1].id).toEqual('B');
      expect(replacers[2].id).toEqual('C');
      expect(replacers[3].id).toEqual('E');
      expect(replacers[4].id).toEqual('D');
    });
  });

  it('ignores a self-cyclical precedence rule', () => {
      const a:Replacer = { id:'A', precedesReplacers:['A', 'B'], onGetTextForEmbedding, onReplace };
      const b:Replacer = { id:'B', precedesReplacers:['C'], onGetTextForEmbedding, onReplace };
      const c:Replacer = { id:'C', precedesReplacers:[], onGetTextForEmbedding, onReplace };
      registerReplacer(a);
      registerReplacer(b);
      registerReplacer(c);
      disableConsoleWarn();
      const replacers = getReplacers(['C', 'B', 'A']);
      reenableConsoleWarn();
      expect(replacers.length).toEqual(3);
      expect(replacers[0].id).toEqual('A');
      expect(replacers[1].id).toEqual('B');
      expect(replacers[2].id).toEqual('C');
  });

  it('ignores a transitive self-cyclical precedence rule', () => {
      const a:Replacer = { id:'A', precedesReplacers:['B'], onGetTextForEmbedding, onReplace };
      const b:Replacer = { id:'B', precedesReplacers:['C', 'A'], onGetTextForEmbedding, onReplace };
      const c:Replacer = { id:'C', precedesReplacers:[], onGetTextForEmbedding, onReplace };
      registerReplacer(a);
      registerReplacer(b);
      registerReplacer(c);
      disableConsoleWarn();
      const replacers = getReplacers(['C', 'B', 'A']);
      reenableConsoleWarn();
      expect(replacers.length).toEqual(3);
      expect(replacers[0].id).toEqual('A');
      expect(replacers[1].id).toEqual('B');
      expect(replacers[2].id).toEqual('C');
  });

  it('ignores a transitive dependency-cyclical precedence rule', () => {
      const a:Replacer = { id:'A', precedesReplacers:['B'], onGetTextForEmbedding, onReplace };
      const b:Replacer = { id:'B', precedesReplacers:['C'], onGetTextForEmbedding, onReplace };
      const c:Replacer = { id:'C', precedesReplacers:['B'], onGetTextForEmbedding, onReplace };
      registerReplacer(a);
      registerReplacer(b);
      registerReplacer(c);
      disableConsoleWarn();
      const replacers = getReplacers(['C', 'B', 'A']);
      reenableConsoleWarn();
      expect(replacers.length).toEqual(3);
      expect(replacers[0].id).toEqual('A');
      expect(replacers[1].id).toEqual('B');
      expect(replacers[2].id).toEqual('C');
  });

  it('prunes precedence rules to replacers not included in request', () => {
      const a:Replacer = { id:'A', precedesReplacers:['B', 'E'], onGetTextForEmbedding, onReplace };
      const b:Replacer = { id:'B', precedesReplacers:['C', 'D'], onGetTextForEmbedding, onReplace };
      const c:Replacer = { id:'C', precedesReplacers:['D'], onGetTextForEmbedding, onReplace };
      registerReplacer(a);
      registerReplacer(b);
      registerReplacer(c);
      disableConsoleWarn();
      const replacers = getReplacers(['C', 'B', 'A']);
      reenableConsoleWarn();
      expect(replacers.length).toEqual(3);
      expect(replacers[0].id).toEqual('A');
      expect(replacers[0].precedesReplacers).toEqual(['B', 'C']);
      expect(replacers[1].id).toEqual('B');
      expect(replacers[1].precedesReplacers).toEqual(['C']);
      expect(replacers[2].id).toEqual('C');
      expect(replacers[2].precedesReplacers).toEqual([]);
  });

  describe('getTextForEmbedding()', () => {
    it('processes built-in replacer', async () => {
      const replacers = getReplacers(['NUMBER']);
      const text = await getTextForEmbedding('i have NUMBER apples and NUMBER2 oranges', replacers);
      expect(text).toEqual('i have thirty seven apples and thirty seven oranges');
    });

    it('processes two built-in replacers', async () => {
      const replacers = getReplacers(['ITEMS', 'NUMBER']);
      const text = await getTextForEmbedding('i have NUMBER ITEMS and NUMBER2 ITEMS2', replacers);
      expect(text).toEqual('i have thirty seven cherry pie and thirty seven cherry pie');
    });
  });

  describe('makeUtteranceReplacements()', () => {
    it('replaces ITEMS', async () => {
      const replacers = getReplacers(['ITEMS']);
      const [utterance, values] = await makeUtteranceReplacements('i have a cherry pie', replacers);
      expect(utterance).toEqual('i have ITEMS');
      expect(values).toEqual({ITEMS: 'a cherry pie'});
    });

    it('replaces NUMBER', async () => {
      const replacers = getReplacers(['NUMBER']);
      const [utterance, values] = await makeUtteranceReplacements('i have thirty seven apples', replacers);
      expect(utterance).toEqual('i have NUMBER apples');
      expect(values).toEqual({NUMBER: 'thirty seven'});
    });

    it('replaces ITEMS and NUMBER', async () => {
      const replacers = getReplacers(['ITEMS', 'NUMBER']);
      const [utterance, values] = await makeUtteranceReplacements('i have shiny apples that i will put in number twelve', replacers);
      expect(utterance).toEqual('i have ITEMS that i will put in NUMBER');
      expect(values).toEqual({NUMBER: 'number twelve', ITEMS: 'shiny apples'});
    });
  });
});