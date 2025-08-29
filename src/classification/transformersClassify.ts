import { assertNonNullable } from '@/common/assertUtil';
import { pipeline, env } from '@xenova/transformers';

/*

type Classifier = (input: any, options?: any) => Promise<any>;

let classifier: Classifier | null = null;
let initialized = false;
const MODEL_NAME = 'Xenova/roberta-large-mnli';
const CACHE_DIR = 'cache/transformers';

export async function initTransformersClassify(): Promise<void> {
  if (initialized && classifier) return;
  const e: any = env as any;
  e.platform = 'node';
  e.cacheDir = CACHE_DIR;
  e.useBrowserCache = false;
  e.allowLocalModels = true;
  if (e.backends?.onnx?.wasm) e.backends.onnx.wasm.proxy = false;
  classifier = (await pipeline('text-classification', MODEL_NAME)) as unknown as Classifier;
  initialized = classifier !== null;
}

export function isTransformersClassifyInitialized(): boolean {
  return initialized;
}

export async function classify(premise: string, hypothesis: string) {
  if (!initialized) await initTransformersClassify();

  // Single pair => arrays of length 1
  const out = await (classifier as Classifier)(
    { text: [premise], text_pair: [hypothesis] },
    { topk: 3 }  // get CONTRADICTION / NEUTRAL / ENTAILMENT
  );

  // `out` is an array (batch), each item is the 3-label array
  return out[0] as { label: string; score: number }[];
} */

const MODEL_NAME = 'Xenova/bart-large-mnli';
const CACHE_DIR = 'cache/transformers';

let initialized = false;

type Classifier = (premise:string, hypotheses:string[], options:any) => Promise<any>;
let classifier:Classifier|null = null;

export async function initTransformersClassify():Promise<void> {
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

export function isTransformersClassifyInitialized(): boolean {
  return initialized;
}

export async function classify(premise:string, hypotheses:string[]) {
  if (!initialized) await initTransformersClassify();
  assertNonNullable(classifier);
  const res = await classifier(premise, hypotheses, { multi_label: false });
  return res;
}