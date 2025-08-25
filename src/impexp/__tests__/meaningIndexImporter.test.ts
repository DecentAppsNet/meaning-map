import { describe, it, expect } from 'vitest';
import { parseMeaningIndex } from '../meaningIndexImporter';
import { UNCLASSIFIED_MEANING_ID } from '../types/MeaningIndex';

describe('meaningIndexImporter', () => {
  describe('parseMeaningIndex()', () => {
    it('returns empty meaning index for empty input', () => {
      expect(parseMeaningIndex('')).toEqual({});
    });

   describe('when parsing numbered headings', () => {
      it('parses one-level heading with trailing dot', () => {
        expect(parseMeaningIndex('1.')).toEqual({ '1': { meaningId: '1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('parses one-level heading without trailing dot', () => {
        expect(parseMeaningIndex('1')).toEqual({ '1': { meaningId: '1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('parses heading number followed by description', () => {
        expect(parseMeaningIndex('1. Adding')).toEqual({ '1': { meaningId: '1', description: 'Adding', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('parses heading number followed by another numbered heading', () => {
        expect(parseMeaningIndex('1. 1.')).toEqual({ '1': { meaningId: '1', description: '1.', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('parses nested heading "1.1"', () => {
        expect(parseMeaningIndex('1.1')).toEqual({ '1.1': { meaningId: '1.1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: '1', childMeaningIds: [] } });
      });

      it('parses nested heading with trailing dot "1.1."', () => {
        expect(parseMeaningIndex('1.1.')).toEqual({ '1.1': { meaningId: '1.1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: '1', childMeaningIds: [] } });
      });

      it('parses deeper nested heading "1.1.1"', () => {
        expect(parseMeaningIndex('1.1.1')).toEqual({ '1.1.1': { meaningId: '1.1.1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: '1.1', childMeaningIds: [] } });
      });

      it('parses deeper nested heading with trailing dot "1.1.1."', () => {
        expect(parseMeaningIndex('1.1.1.')).toEqual({ '1.1.1': { meaningId: '1.1.1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: '1.1', childMeaningIds: [] } });
      });

      it('rejects invalid numeric-like tokens (no heading created)', () => {
        expect(parseMeaningIndex('1a.')).toEqual({});
      });

      it('parses heading preceded by whitespace', () => {
        expect(parseMeaningIndex('   1.')).toEqual({ '1': { meaningId: '1', description: '', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('handles extra whitespace after dot before description', () => {
        expect(parseMeaningIndex('1.   Adding')).toEqual({ '1': { meaningId: '1', description: 'Adding', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('rejects a numbered heading immediately followed by description with no whitespace', () => {
        expect(parseMeaningIndex('1.Adding')).toEqual({});
      });

      it('throws when encountering reserved meaning ID "0"', () => {
        expect(() => parseMeaningIndex('0.')).toThrow();
      });
    });

    describe('when parsing description after numbered headings', () => {
      it('parses description after one-level heading', () => {
        expect(parseMeaningIndex('1. Adding')).toEqual({ '1': { meaningId: '1', description: 'Adding', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: UNCLASSIFIED_MEANING_ID, childMeaningIds: [] } });
      });

      it('parses description after nested heading', () => {
        expect(parseMeaningIndex('1.1. Adding')).toEqual({ '1.1': { meaningId: '1.1', description: 'Adding', params: [], promptInstructions: '', nShotPairs: [], parentMeaningId: '1', childMeaningIds: [] } });
      });
    });


    describe('when parsing parameters from numbered headings', () => {
      it('no parameters when description has no ALL-CAPS tokens', () => {
        const res = parseMeaningIndex('1. Adding items');
        expect(res['1'].params).toEqual([]);
      });

      it('single parameter is extracted from description', () => {
        const res = parseMeaningIndex('1. Adding ITEMS');
        expect(res['1'].params).toEqual(['ITEMS']);
      });

      it('multiple parameters are extracted in order', () => {
        const res = parseMeaningIndex('1. ACTION ITEMS');
        expect(res['1'].params).toEqual(['ACTION', 'ITEMS']);
      });

      it('redundant parameters are deduped', () => {
        const res = parseMeaningIndex('1. ITEMS and ITEMS');
        expect(res['1'].params).toEqual(['ITEMS']);
      });
    });

    describe('when parsing prompt instructions after numbered headings', () => {
      it('no instructions when none present', () => {
        const res = parseMeaningIndex('1.');
        expect(res['1'].promptInstructions).toBe('');
      });

      it('instructions before n-shot are captured', () => {
        const sample = `1.\nNote: do this\nUSER: u\nASSISTANT: a`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].promptInstructions).toBe('Note: do this');
      });

      it('instructions after n-shot are captured', () => {
        const sample = `1.\nUSER: u\nASSISTANT: a\nNote: after`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].promptInstructions).toBe('Note: after');
      });

      it('an instruction between USER and ASSISTANT causes a parse error', () => {
        const sample = `1.\nUSER: u\nNote: intrude\nASSISTANT: a`;
        expect(() => parseMeaningIndex(sample)).toThrow();
      });

      it('and instruction between n-shot pairs is parsed', () => {
        const sample = `1.\nUSER: u\nASSISTANT: a\nNote: between\nUSER: u2\nASSISTANT: a2`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].promptInstructions).toBe('Note: between');
      });

      it('concatenates instructions found before and after n-shot pairs', () => {
        const sample = `1.\nUSER: u\nASSISTANT: a\nNote: before\nUSER: u2\nASSISTANT: a2\nNote: after`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].promptInstructions).toBe('Note: before\nNote: after');
      });
    });

    describe('parsing n-shot examples', () => {
      it('no examples -> empty nShotPairs', () => {
        const res = parseMeaningIndex('1.');
        expect(res['1'].nShotPairs).toEqual([]);
      });

      it('correctly-formed USER/ASSISTANT pairs are parsed', () => {
        const sample = `1.\nUSER: hello\nASSISTANT: hi\nUSER: bye\nASSISTANT: bye-bye`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].nShotPairs.length).toBe(2);
        expect(res['1'].nShotPairs[0]).toEqual({ userMessage: 'hello', assistantResponse: 'hi' });
        expect(res['1'].nShotPairs[1]).toEqual({ userMessage: 'bye', assistantResponse: 'bye-bye' });
      });

      it('USER without following ASSISTANT throws', () => {
        const sample = `1.\nUSER: lonely`;
        expect(() => parseMeaningIndex(sample)).toThrow();
      });

      it('ASSISTANT without preceding USER becomes an instruction', () => {
        const sample = `1.\nASSISTANT: unsolicited`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].promptInstructions).toBe('ASSISTANT: unsolicited');
      });
    });

    describe('when parsing ignored content', () => {
      it('lines before first heading are ignored', () => {
        const sample = `Intro line\n1. Heading`;
        const res = parseMeaningIndex(sample);
        expect(Object.keys(res)).toEqual(['1']);
      });

      it('all-whitespace lines are ignored', () => {
        const sample = `   \n\n1.`;
        const res = parseMeaningIndex(sample);
        expect(Object.keys(res)).toEqual(['1']);
      });
    });

    describe('when parsing text containing multiple meanings', () => {
      it('parses consecutive meanings', () => {
        const sample = `1. A\n\n2. B`;
        const res = parseMeaningIndex(sample);
        expect(Object.keys(res)).toEqual(['1', '2']);
      });

      it('assigns parentMeaningId and childMeaningIds for hierarchical ids', () => {
        const sample = `1. Parent\n\n1.1. Child\n\n1.1.1. Grandchild`;
        const res = parseMeaningIndex(sample);
        expect(res['1'].parentMeaningId).toBe(UNCLASSIFIED_MEANING_ID);
        expect(res['1'].childMeaningIds).toEqual(['1.1']);
        expect(res['1.1'].parentMeaningId).toBe('1');
        expect(res['1.1'].childMeaningIds).toEqual(['1.1.1']);
        expect(res['1.1.1'].parentMeaningId).toBe('1.1');
        expect(res['1.1.1'].childMeaningIds).toEqual([]);
      });
    });
  });
});
