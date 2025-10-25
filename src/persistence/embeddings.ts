import UnitVector from "@/embeddings/types/UnitVector";
import { fillTemplate } from "./pathUtil";
import { getBytes, setBytes } from "./pathStore";
import { bytesToUnitVector, unitVectorToBytes } from "@/embeddings/vectorUtil";
import { MIMETYPE_OCTET_STREAM } from "./mimeTypes";

const EMBEDDING_KEY_TEMPLATE = '/embeddings/{utterance}.bin';

export async function getEmbedding(utterance:string):Promise<UnitVector|null> {
  const key = fillTemplate(EMBEDDING_KEY_TEMPLATE, {utterance});
  const vectorBytes = await getBytes(key);
  if (!vectorBytes) return null;
  return bytesToUnitVector(vectorBytes);
}

export async function setEmbedding(utterance:string, vector:UnitVector):Promise<void> {
  const key = fillTemplate(EMBEDDING_KEY_TEMPLATE, {utterance});
  const vectorBytes = unitVectorToBytes(vector);
  await setBytes(key, vectorBytes, MIMETYPE_OCTET_STREAM);
}