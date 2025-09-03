/* v8 ignore start */
import { initEmbedder } from "@/embeddings/transformersEmbedder";
import { initClassifier } from "@/classification/transformersClassify";

export async function initialize() {
  await initEmbedder();
  await initClassifier();
}

/* v8 ignore end */