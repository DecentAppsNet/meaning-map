import UnitVector from '../embeddings/types/UnitVector';
import { createUnitVector } from '../embeddings/vectorUtil';
import Extractor from './types/Extractor';
import { loadModel, extract, extractMultiple } from './embedders/mxbai-embed-large-v1';
import UnitVectorGroup from '@/embeddings/types/UnitVectorGroup';
import { assertTruthy } from '@/common/assertUtil';

/* v8 ignore start */ // This module is all glue. If anything with good test value emerges, refactor it to a separate module. */

let extractor:Extractor | null = null;
let initialized = false;

const vectorCache:Map<string, UnitVector> = new Map();

export async function initEmbedder(): Promise<void> {
  if (initialized && extractor) return; // already ready
  extractor = await loadModel();
  initialized = extractor !== null;
}

export function isEmbedderInitialized(): boolean {
  return initialized;
}

export function clearEmbeddingCache(): void {
  vectorCache.clear();
}

export async function embedSentence(sentence:string):Promise<UnitVector> {
  if (!initialized) await initEmbedder();
  const key = sentence.trim().toLowerCase();
  const cached = vectorCache.get(key);
  if (cached) return cached;
  const rawVector = await extract(extractor!, key);
  const vec = createUnitVector(rawVector);
  vectorCache.set(key, vec);
  return vec;
}

export async function embedSentences(sentences:string[]):Promise<UnitVectorGroup> {
  if (!initialized) await initEmbedder();
  const requests = sentences // Find sentences not already in cache.
    .map((sentence, index) => { return { sentence, index } })
    .filter(r => !vectorCache.has(r.sentence));
  if (requests.length > 0) { // Batch embed missing sentences.
    const keys = requests.map(r => r.sentence);
    const rawVectors = await extractMultiple(extractor!, keys);
    rawVectors.forEach((rawVector, resultI) => {
      const key = sentences[requests[resultI].index];
      const unitVector = createUnitVector(rawVector);
      vectorCache.set(key, unitVector);
    });
  }
  const unitVectors = sentences.map(s => { // Now all should be in cache.
    const cached = vectorCache.get(s);
    assertTruthy(cached);
    return cached;
  });
  return unitVectors;
}

/* v8 ignore end */
