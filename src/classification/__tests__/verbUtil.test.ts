import { describe, it, expect, beforeAll } from 'vitest'

import { initEmbedder } from '@/embeddings/transformersEmbedder'
import { isPlacementVerb } from '../verbUtil'
import { endSection, flush, startSection } from '@/common/describeLog'

describe('verbUtil', () => {
  beforeAll(async () => {
    await initEmbedder();
  });

  describe('isPlacementVerb()', () => {
    it('returns true for a placement verb', async () => {
      startSection('returns true for a placement verb');
      const placementVerbs = ["deliver","transfer","push","pull","lift","drop off","ship","send","throw in","park"];
      for (let i = 0; i < placementVerbs.length; ++i) {
        expect(await isPlacementVerb(placementVerbs[i])).toBeTruthy();
      }
      endSection();
    });

    it('returns false for a stative verb', async () => {
      const stativeVerbs = ["exist","remain","belong","seem","appear","resemble","consist","contain","weigh"];
      startSection('returns false for a stative verb');
      for (let i = 0; i < stativeVerbs.length; ++i) {
        expect(await isPlacementVerb(stativeVerbs[i])).toBeFalsy();
      }
      endSection();
    });
  });
});