/* v8 ignore start */
import { initTransformersEmbedder } from "@/embeddings/transformersEmbedder";

export async function initialize() {
  await initTransformersEmbedder();
}

/* v8 ignore end */