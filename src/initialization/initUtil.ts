/* v8 ignore start */
import { initEmbedder } from "@/transformersJs/transformersEmbedder";
import { initClassifier } from "@/transformersJs/transformersClassify";

export enum InitOption {
  NONE = 0,
  EMBEDDER = 1 << 0,
  CLASSIFIER = 1 << 1,
  ALL = EMBEDDER | CLASSIFIER,
}

export async function initialize(options:InitOption = InitOption.NONE):Promise<void> {
  if (options & InitOption.EMBEDDER) await initEmbedder();
  if (options & InitOption.CLASSIFIER) await initClassifier();
}

/* v8 ignore end */