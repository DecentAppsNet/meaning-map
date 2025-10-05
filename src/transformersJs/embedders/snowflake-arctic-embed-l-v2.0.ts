// Minimal adapter around @xenova/transformers for feature-extraction embeddings (Node-only).
import { pipeline, env } from '@xenova/transformers';
import Extractor from '../types/Extractor';
import { CACHE_DIR } from '../constants';
import { toRawVectorArray } from './extractUtil';

/* v8 ignore start */ // This module is all glue. If anything with good test value emerges, refactor it to a separate module. */
const MODEL_NAME = 'Snowflake/snowflake-arctic-embed-l-v2.0';

export async function loadModel():Promise<Extractor> {
  // Force Node-friendly settings and local cache.
  const e:any = env as any;
  e.platform = 'node';
  e.cacheDir = CACHE_DIR;
  e.useBrowserCache = false;
  e.allowLocalModels = true;
  if (e.backends?.onnx?.wasm) e.backends.onnx.wasm.proxy = false;
  const extractor = (await pipeline('feature-extraction', MODEL_NAME)) as unknown as Extractor;
  return extractor;
}

export async function extract(extractor:Extractor, key:string):Promise<number[]> {
  const out = await (extractor as Extractor)(key, { pooling:'cls', normalize:true });
  return toRawVectorArray(out);
}

/* v8 ignore end */