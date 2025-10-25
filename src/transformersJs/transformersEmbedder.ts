import UnitVector from '../embeddings/types/UnitVector';
import { createUnitVector } from '../embeddings/vectorUtil';
import Extractor from './types/Extractor';
import { loadModel, extract, extractMultiple } from './embedders/mxbai-embed-large-v1';
import UnitVectorGroup from '@/embeddings/types/UnitVectorGroup';
import { assertTruthy } from '@/common/assertUtil';
import { getRuntime } from '@/common/runtimeUtil';
import { getEmbedding, setEmbedding } from '@/persistence/embeddings';

/* v8 ignore start */

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

async function _getCachedVector(key:string):Promise<UnitVector|null> {
  let cached:UnitVector|null = vectorCache.get(key) ?? null;
  if (cached === null && getRuntime() === 'browser') {
    cached = await getEmbedding(key);
    if (cached) vectorCache.set(key, cached);
  }
  return cached;
}

async function _setCachedVector(key:string, vector:UnitVector):Promise<void> {
  vectorCache.set(key, vector);
  if (getRuntime() === 'browser') await setEmbedding(key, vector);
}

export async function embedSentence(sentence:string):Promise<UnitVector> {
  if (!initialized) await initEmbedder();
  const key = sentence.trim().toLowerCase();
  const cached = await _getCachedVector(key);
  if (cached) return cached;
  const rawVector = await extract(extractor!, key);
  const vec = createUnitVector(rawVector);
  _setCachedVector(key, vec);
  return vec;
}

async function _findUncachedSentences(sentences:string[]):Promise<{sentence:string, index:number}[]> {
  const uncached:{sentence:string, index:number}[] = [];
  for (let i = 0; i < sentences.length; ++i) {
    const sentence = sentences[i];
    const key = sentence.trim().toLowerCase();
    const cached = await _getCachedVector(key);
    if (!cached) uncached.push({ sentence, index: i });
  }
  return uncached;
}

export async function embedSentences(sentences:string[]):Promise<UnitVectorGroup> {
  if (!initialized) await initEmbedder();
  const requests = await _findUncachedSentences(sentences);
  if (requests.length > 0) { // Batch embed missing sentences.
    const keys = requests.map(r => r.sentence);
    const rawVectors = await extractMultiple(extractor!, keys);
    rawVectors.forEach((rawVector, resultI) => { // Add to cache.
      const key = sentences[requests[resultI].index];
      const unitVector = createUnitVector(rawVector);
      _setCachedVector(key, unitVector);
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
