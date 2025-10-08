import { describe, it, expect, beforeAll } from 'vitest';
import { loadMeaningMap } from "../meaningMapImporter";
import exampleMeaningMapText from "./data/exampleMeaningMap";
import { initEmbedder, isEmbedderInitialized } from '@/transformersJs/transformersEmbedder';

describe('meaningMapImporter', () => {
  beforeAll(async () => {
    if (!isEmbedderInitialized()) await initEmbedder();
  });

  it('loads example meaning map without error', async () => {
    const meaningMap = await loadMeaningMap(exampleMeaningMapText);
    expect(meaningMap).toBeDefined();
  });
});
