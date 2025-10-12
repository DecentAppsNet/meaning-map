import { describe, it, expect, beforeEach } from 'vitest';
import { registerReplacer, unregisterReplacer, isReplacerRegistered, getReplacers, getTextForEmbedding, paramToReplacerId } from "../replaceUtil";
import Replacer from '../types/Replacer';

describe('replaceUtil', () => {
  beforeEach(() => {
    unregisterReplacer('CUSTOM');
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
      const customReplacer:Replacer = {
        id: 'CUSTOM',
        precedesReplacers: [],
        onGetTextForEmbedding: async (utterance:string) => utterance,
        onReplace: async (utterance:string) => [utterance, {}],
      };
      registerReplacer(customReplacer);
      expect(isReplacerRegistered('CUSTOM')).toEqual(true);
    });
  });

  describe('registerReplacer()', () => {
    it('registers custom replacer', () => {
      const customReplacer:Replacer = {
        id: 'CUSTOM',
        precedesReplacers: [],
        onGetTextForEmbedding: async (utterance:string) => utterance,
        onReplace: async (utterance:string) => [utterance, {}],
      };
      registerReplacer(customReplacer);
      expect(isReplacerRegistered('CUSTOM')).toEqual(true);
    });

    it('throws error when registering replacer with duplicate id', () => {
      const customReplacer:Replacer = {
        id: 'CUSTOM',
        precedesReplacers: [],
        onGetTextForEmbedding: async (utterance:string) => utterance,
        onReplace: async (utterance:string) => [utterance, {}],
      };
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
      const customReplacer:Replacer = {
        id: 'CUSTOM',
        precedesReplacers: [],
        onGetTextForEmbedding: async (utterance:string) => utterance,
        onReplace: async (utterance:string) => [utterance, {}],
      };
      registerReplacer(customReplacer);
      const replacers = getReplacers(['CUSTOM']);
      expect(replacers.length).toEqual(1);
      expect(replacers[0].id).toEqual('CUSTOM');
    });
  });

  describe('getTextForEmbedding()', () => {
    it('processes built-in replacer', async () => {
      const replacers = getReplacers(['NUMBER']);
      const text = await getTextForEmbedding('i have NUMBER apples and NUMBER2 oranges', replacers);
      expect(text).toEqual('i have thirty-seven apples and thirty-seven oranges');
    });

    it('processes two built-in replacers', async () => {
      const replacers = getReplacers(['ITEMS', 'NUMBER']);
      const text = await getTextForEmbedding('i have NUMBER ITEMS and NUMBER2 ITEMS2', replacers);
      expect(text).toEqual('i have thirty-seven cherry pie and thirty-seven cherry pie');
    });
  });
});