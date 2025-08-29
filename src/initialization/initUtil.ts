/* v8 ignore start */
import { initTransformersEmbedder } from "@/embeddings/transformersEmbedder";
import { initTransformersClassify } from "@/classification/transformersClassify";

export async function initialize() {
  await initTransformersEmbedder();
  await initTransformersClassify();
}

/* v8 ignore end */