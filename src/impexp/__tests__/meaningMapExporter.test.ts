import { describe, it, expect } from 'vitest';
import { meaningMapToText } from "../meaningMapExporter";
import { loadMeaningMap } from '../meaningMapImporter';

describe('meaningMapExporter', () => {
  describe('meaningMapToText()', () => {
    describe('when embeddings are not included in export', () => {
      it('exports an empty map', async () => {
        const text = '';
        const meaningMap = await loadMeaningMap(text);
        const roundtripText = await meaningMapToText(meaningMap, false);
        expect(roundtripText).toEqual(text);
      });

      it('exports a minimal map', async () => {
        const text = '# category\ncategory\n';
        const meaningMap = await loadMeaningMap(text);
        const roundtripText = await meaningMapToText(meaningMap, false);
        expect(roundtripText).toEqual(text);
      });

      it('exports a map with nesting', async () => {
        const text = '# category 1\n1\n## category 1a\n1a\n## category 1b\n1b\n# category 2\n2\n## category 2a\n2a\n';
        const meaningMap = await loadMeaningMap(text);
        const roundtripText = await meaningMapToText(meaningMap, false);
        expect(roundtripText).toEqual(text);
      });

      it('exports a map with node that has a specified certainty threshold', async () => {
        const text = '# category 1 >.5\n1\n';
        const meaningMap = await loadMeaningMap(text);
        const roundtripText = await meaningMapToText(meaningMap, false);
        expect(roundtripText).toEqual(text);
      });
    });

    describe('when embeddings are included in export', () => {
      it('exports an empty map', async () => {
        const text = '';
        const meaningMap = await loadMeaningMap(text);
        const roundtripText = await meaningMapToText(meaningMap, true);
        expect(roundtripText).toEqual(text);
      });

      it('exports a map with embeddings at end', async () => {
        const text = '# category\ncategory\n';
        const meaningMap = await loadMeaningMap(text);
        const exportedText = await meaningMapToText(meaningMap, true);
        expect(exportedText.startsWith(text)).toBe(true);
        expect(exportedText.includes('<!-- embeddings')).toBe(true);
        expect(exportedText.includes('-->')).toBe(true);
        expect(exportedText.includes('category=')).toBe(true);
      });
    });
  });
});