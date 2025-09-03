/* v8 ignore start */ // This module is all glue. If anything with good test value emerges, refactor it to a separate module. */
import { assertNonNullable } from '@/common/assertUtil';
import { pipeline, env } from '@xenova/transformers';

const MODEL_NAME = 'Xenova/roberta-large-mnli';
const CACHE_DIR = 'cache/transformers';

let initialized = false;

type Classifier = (premise:string, hypotheses:string[], options:any) => Promise<any>;
let classifier:Classifier|null = null;

export async function initClassifier():Promise<void> {
  if (initialized) return;
  const e: any = env as any;
  e.platform = 'node';
  e.cacheDir = CACHE_DIR;
  e.useBrowserCache = false;
  e.allowLocalModels = true;
  if (e.backends?.onnx?.wasm) e.backends.onnx.wasm.proxy = false;
  classifier = (await pipeline('zero-shot-classification', MODEL_NAME)) as unknown as Classifier;
  initialized = classifier !== null;
}

export function isClassifierInitialized(): boolean {
  return initialized;
}

export async function classify(premise:string, hypotheses:string[]) {
  if (!initialized) await initClassifier();
  assertNonNullable(classifier);
  const res = await classifier(premise, hypotheses, { multi_label: false });
  return res;
}
/* v8 ignore end */