import { describe, expect, it, beforeEach, beforeAll } from 'vitest';

import { compareNouns, createNounMatchCriteria, doesNounMatchCriteria } from "../wordComparisonUtil";
import { initTransformersEmbedder, clearEmbeddingCache } from '@/embeddings/transformersEmbedder';

describe('wordComparisonUtil', () => {
  beforeAll(async () => {
    await initTransformersEmbedder();
  });

  beforeEach(() => {
    clearEmbeddingCache();
  });

  describe('compareNouns()', () => {
    it('returns 1.0 for identical nouns', async () => {
      const similarity = await compareNouns('cat', 'cat');
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('returns a low score for two completely different nouns', async () => {
      expect(await compareNouns('flower', 'army')).toBeLessThan(0.5);
    });

    it('returns a high score for two similar nouns', async () => {
      expect(await compareNouns('flower', 'rose')).toBeGreaterThan(0.5);
    });
  });

  describe('doesNounMatchCriteria()', () => {
    it('returns true when a noun matches a high-threshold self-criterion and false for unrelated nouns', async () => {
      const criteria = await createNounMatchCriteria(['cat@0.95', 'dog@0.95']);
      // 'cat' should match the 'cat@0.95' criterion (self-similarity)
      expect(await doesNounMatchCriteria('cat', criteria)).toBe(true);
      // 'banana' is unlikely to match either high-threshold animal criteria
      expect(await doesNounMatchCriteria('banana', criteria)).toBe(false);
    });
  });

  describe('createNounMatchCriteria()', () => {
    it('creates criteria', async () => {
      const criteria = await createNounMatchCriteria(['dog', 'cat']);
      expect(criteria.length).toBe(2);
    });

    it('creates criteria with custom thresholds', async () => {
      const criteria = await createNounMatchCriteria(['dog@.3', 'cat@.4']);
      expect(criteria[0].acceptanceThreshold).toBe(.3);
      expect(criteria[1].acceptanceThreshold).toBe(.4);
    });
  });
});