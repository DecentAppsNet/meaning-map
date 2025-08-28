// Minimal adapter around @xenova/transformers for feature-extraction embeddings (Node-only).
import { pipeline, env } from '@xenova/transformers';
import UnitVector from './types/UnitVector';
import { createUnitVector } from './vectorUtil';

/* v8 ignore start */ // This module is all glue. If anything with good test value emerges, refactor it to a separate module. */
type Extractor = (input: string, options?: { pooling?: 'mean' | 'max'; normalize?: boolean }) => Promise<number[] | Float32Array | { data?: Float32Array | number[] } | unknown>;

let extractor: Extractor | null = null;
let initialized = false;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const CACHE_DIR = 'cache/transformers';

const vectorCache:Map<string, UnitVector> = new Map();

function toArray(output: unknown): number[] {
  // The transformers.js pipeline with pooling returns either a Float32Array or number[].
  // Be defensive and support a few shapes without importing types.
  if (Array.isArray(output)) return output as number[];
  if (output instanceof Float32Array) return Array.from(output);
  if (output && typeof output === 'object' && 'data' in (output as any)) {
    const data = (output as any).data;
    if (data instanceof Float32Array) return Array.from(data);
    if (Array.isArray(data)) return data as number[];
  }
  // Fallback: try to coerce
  try { return Array.from(output as any); } catch { /* noop */ }
  throw new Error('Unexpected embedding output shape');
}

export async function initTransformersEmbedder(): Promise<void> {
  if (initialized && extractor) return; // already ready
  // Force Node-friendly settings and local cache.
  const e: any = env as any;
  e.platform = 'node';
  e.cacheDir = CACHE_DIR;
  e.useBrowserCache = false;
  e.allowLocalModels = true;
  if (e.backends?.onnx?.wasm) e.backends.onnx.wasm.proxy = false;
  extractor = (await pipeline('feature-extraction', MODEL_NAME)) as unknown as Extractor;
  initialized = extractor !== null;
}

export function isInitialized(): boolean {
  return initialized;
}

export function clearEmbeddingCache(): void {
  vectorCache.clear();
}

export async function embedSentence(sentence:string):Promise<UnitVector> {
  if (!initialized || !extractor) await initTransformersEmbedder();
  const key = sentence.trim().toLowerCase();
  const cached = vectorCache.get(key);
  if (cached) return cached;
  const out = await (extractor as Extractor)(key, { pooling:'mean', normalize:true });
  const vec = createUnitVector(toArray(out));
  vectorCache.set(key, vec);
  return vec;
}

/* v8 ignore end */
