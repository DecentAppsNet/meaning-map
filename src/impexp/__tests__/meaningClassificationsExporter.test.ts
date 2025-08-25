import { describe, it, expect } from 'vitest';
import { formatMeaningClassificationsForExport } from '../meaningClassificationsExporter';
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from '../types/MeaningIndex';
import Meaning from '../types/Meaning';

const DEFAULT_MEANING:Meaning = {
  meaningId: '1',
  description: 'Desc',
  params: [],
  promptInstructions: '',
  parentMeaningId: UNCLASSIFIED_MEANING_ID,
  childMeaningIds: [],
  nShotPairs: []
};

describe('meaningClassificationsExporter', () => {
  describe('formatMeaningClassificationsForExport()', () => {
    it('returns empty string for empty classifications', () => {
      expect(formatMeaningClassificationsForExport({})).toBe('');
    });

    it('formats multiple meanings in alphabetical order with unmapped last', () => {
      const classifications:any = {
        '2': ['two-a', 'two-b'],
        '1': ['one'],
        '0': ['unmapped']
      };
      const out = formatMeaningClassificationsForExport(classifications);
      const first = out.indexOf('1\none\n');
      const second = out.indexOf('2\ntwo-a\ntwo-b\n');
      const last = out.indexOf('0\nunmapped\n');
      expect(first).toBe(0);
      expect(second).toBeGreaterThan(first);
      expect(last).toBeGreaterThan(second);
    });

    it('includes meaning descriptions when meaningIndex is provided', () => {
      const classifications:any = { '1': ['one'] };
      const meaningIndex:any = { '1': {...DEFAULT_MEANING} } as MeaningIndex;
      const out = formatMeaningClassificationsForExport(classifications, meaningIndex);
      expect(out.startsWith('1 Desc\n')).toBe(true);
    });

    it('omits descriptions when meaningIndex not provided', () => {
      const classifications:any = { '1': ['one'] };
      const out = formatMeaningClassificationsForExport(classifications, undefined);
      expect(out.startsWith('1\n')).toBe(true);
    });

    it('adds "0" header when unmapped present and no MeaningIndex provided', () => {
      const classifications:any = { '0': ['u'] };
      const out = formatMeaningClassificationsForExport(classifications);
      expect(out.startsWith('0\n')).toBe(true);
    });

    it('adds "0 unclassified" header when unmapped present and MeaningIndex provided', () => {
      const classifications:any = { '0': ['u'] };
      const meaningIndex:any = {} as MeaningIndex;
      const out = formatMeaningClassificationsForExport(classifications, meaningIndex);
      expect(out.startsWith('0 unclassified\n')).toBe(true);
    });

    it('omits description when meaningId is not present in provided meaningIndex', () => {
      const classifications:any = { '2': ['a'] };
      const meaningIndex:any = { '1': { ...DEFAULT_MEANING } } as MeaningIndex;
      const out = formatMeaningClassificationsForExport(classifications, meaningIndex);
      expect(out.startsWith('2\n')).toBe(true);
    });
  });
});
