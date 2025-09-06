import { describe, expect, it, beforeEach, beforeAll } from 'vitest';

import { initEmbedder, clearEmbeddingCache } from '@/embeddings/transformersEmbedder';
import { createWordCentroid, createWordsCentroid } from '../wordComparisonUtil';
import { compareUnitVectors } from '@/embeddings/vectorUtil';

const EMBED_TIMEOUT = 5000;

describe('wordComparisonUtil', () => {
  beforeAll(async () => {
    await initEmbedder();
  });

  beforeEach(() => {
    clearEmbeddingCache();
  });

  it('returns nearly-identical centroids for the same word', async () => {
    const templates = ['I have ___', 'put ___ in the box'];
    const a = await createWordCentroid('apple', templates);
    const b = await createWordCentroid('apple', templates);
    const sim = compareUnitVectors(a, b);
    expect(sim).toBeGreaterThan(0.995);
  }, EMBED_TIMEOUT);

  it('returns noticeably different centroids for different words', async () => {
    const templates = ['I have ___', 'put ___ in the box'];
    const a = await createWordCentroid('apple', templates);
    const o = await createWordCentroid('orange', templates);
    const sim = compareUnitVectors(a, o);
    expect(sim).toBeLessThan(0.99);
  }, EMBED_TIMEOUT);

  it('group centroid is closer to a member word than to an unrelated word', async () => {
    const templates = ['I have ___', 'put ___ in the box'];
    const group = await createWordsCentroid(['apple', 'pear'], templates);
    const apple = await createWordCentroid('apple', templates);
    const car = await createWordCentroid('car', templates);
    const simApple = compareUnitVectors(group, apple);
    const simCar = compareUnitVectors(group, car);
    expect(simApple).toBeGreaterThan(simCar);
  }, EMBED_TIMEOUT);

  it('debiasTemplates changes the resulting centroid (debiasing applied)', async () => {
    const templates = ['I have ___'];
    const debiasSame = ['I have ___'];
    const debiasGeneric = ['This is a sentence about ___'];
    const a = await createWordsCentroid(['apple'], templates, debiasSame);
    const b = await createWordsCentroid(['apple'], templates, debiasGeneric);
    const sim = compareUnitVectors(a, b);
    // Expect some measurable difference when using a different debias template
    expect(sim).toBeLessThan(0.9999);
  }, EMBED_TIMEOUT);
});