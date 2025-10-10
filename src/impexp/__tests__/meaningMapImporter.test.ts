import { describe, it, expect, beforeAll } from 'vitest';
import { loadMeaningMap } from "../meaningMapImporter";
import exampleMeaningMapText from "./data/exampleMeaningMap";
import { initEmbedder, isEmbedderInitialized } from '@/transformersJs/transformersEmbedder';

describe('meaningMapImporter', () => {
  beforeAll(async () => {
    if (!isEmbedderInitialized()) await initEmbedder();
  });

  describe('loadMeaningMap()', () => {
    it('loads an empty meaning map', async () => {
      const meaningMap = await loadMeaningMap('');
      expect(meaningMap).toBeDefined();
      expect(meaningMap.root).toBeDefined();
      expect(meaningMap.root.children.length).toBe(0);
    });

    it('loads example meaning map without error', async () => {
      const meaningMap = await loadMeaningMap(exampleMeaningMapText);
      expect(meaningMap).toBeDefined();
    });
    it('throws on invalid section header syntax', async () => {
      const text = `#x invalid`; // missing space after '#'
      await expect(loadMeaningMap(text)).rejects.toThrow(/invalid section header syntax/);
    });

    it('throws when depth increases by more than one', async () => {
      const text = `# a\n### b`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/increases in depth by more than one/);
    });

    it('throws when header line does not contain a description', async () => {
      const text = `#`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/header line does not contain a description/);
    });

    it('throws when ">" is not followed by a number', async () => {
      const text = `# head >`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/">" must be followed by a number\./);
    });

    it('throws when ">" number is out of range', async () => {
      const text = `# head >2`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/">" must be followed by a number between 0 and 1/);
    });

    it('throws when an utterance appears before any section head', async () => {
      const text = `hello world`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/comes before a section head/);
    });

    it('throws when utterance is not normalized/valid', async () => {
      const text = `# s\nHello`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/is not in expected utterance format/);
    });

    it('throws on duplicate header description', async () => {
      const text = `# a\n# a`;
      await expect(loadMeaningMap(text)).rejects.toThrow(/duplicate description found for heading/);
    });

  });

});
