import { pipeline, env } from '@xenova/transformers';
import Extractor from '../types/Extractor';
import { CACHE_DIR } from '../constants';
import { toRawVectorArray } from './extractUtil';

/* v8 ignore start */ // This module is all glue. If anything with good test value emerges, refactor it to a separate module. */
const MODEL_NAME = 'mixedbread-ai/mxbai-embed-large-v1';

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

export async function extractMultiple(extractor:Extractor, keys:string[]):Promise<number[][]> {
  const outMultiple = await (extractor as Extractor)(keys, { pooling:'cls', normalize:true });
  const outArray = outMultiple.tolist();
  const rawVectors = outArray.map(toRawVectorArray);
  return rawVectors;
}

/* v8 ignore end */