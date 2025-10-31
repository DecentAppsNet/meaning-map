import { describe, it, expect } from 'vitest';
import { meaningMapToText } from "../meaningMapExporter";
import { loadMeaningMap } from '../meaningMapImporter';
import { makeUtteranceReplacements } from '@/replacement/replaceUtil';

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
        let commentPos = exportedText.indexOf('<!-- embeddings');
        expect(commentPos).toBeGreaterThan(-1);
        let endCommentPos = exportedText.indexOf('-->', commentPos);
        expect(endCommentPos).toBeGreaterThan(commentPos);
        let embeddingsText = exportedText.substring(commentPos, endCommentPos);
        expect(embeddingsText.includes('category=')).toBe(true);
      });

      it('exports a map with embedding that has replaced text in key', async () => {
        const text = '# i have ITEMS\ni have ITEMS\n';
        const meaningMap = await loadMeaningMap(text);
        const exportedText = await meaningMapToText(meaningMap, true);
        let commentPos = exportedText.indexOf('<!-- embeddings');
        expect(commentPos).toBeGreaterThan(-1);
        let endCommentPos = exportedText.indexOf('-->', commentPos);
        expect(endCommentPos).toBeGreaterThan(commentPos);
        let embeddingsText = exportedText.substring(commentPos, endCommentPos);
        const replacedKey = await meaningMap.replacers[0].onGetTextForEmbedding('i have ITEMS');
        expect(embeddingsText.includes(replacedKey)).toBe(true);
      });
    });
  });
});