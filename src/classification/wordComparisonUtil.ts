import { embedSentence, isInitialized } from "@/embeddings/transformersEmbedder";
import UnitVector from "@/embeddings/types/UnitVector";
import { averageUnitVectors, compareUnitVectors, removeProjectionFromUnitVector } from '@/embeddings/vectorUtil';
import VectorMatchCriteria from "./types/VectorMatchCriteria";

let theCreateTemplateEmbeddingPromise:Promise<UnitVector> | null = null;

function _createNounHintingSentences(noun:string):string[] { // Used to disambiguate that the word is a noun.
  return [`The ${noun} is here.`, `I have the ${noun}.`, `Look at the ${noun}.`];
}

async function _createAveragedNounEmbedding(noun:string):Promise<UnitVector> {
  let templateSentences = _createNounHintingSentences(noun);
  const embeddings:UnitVector[] = [];
  for(let i = 0; i < templateSentences.length; ++i) {
    embeddings.push(await embedSentence(templateSentences[i]));
  }
  return averageUnitVectors(embeddings);
}

async function _getTemplateEmbedding():Promise<UnitVector> {
  if (!theCreateTemplateEmbeddingPromise) theCreateTemplateEmbeddingPromise = _createAveragedNounEmbedding('___');
  return theCreateTemplateEmbeddingPromise;
}

async function _embedNoun(noun:string):Promise<UnitVector> {
  const nounEmbedding = await _createAveragedNounEmbedding(noun);
  const templateEmbedding = await _getTemplateEmbedding();
  try {
    return removeProjectionFromUnitVector(nounEmbedding, templateEmbedding); // Debias by removing generic template embedding.
  /* v8 ignore start */
  } catch {
    return nounEmbedding; // Unlikely, but if the noun is "___" or something equally generic, there won't be a direction to normalize.
  }
  /* v8 ignore end */
}

export async function compareNouns(nounA:string, nounB:string):Promise<number> {
  if (!isInitialized()) throw new Error('Transformers embedder not initialized.');

  const a = await _embedNoun(nounA);
  const b = await _embedNoun(nounB);
  const similarity = compareUnitVectors(a, b);
  return similarity;
}

const DEFAULT_ACCEPTANCE_THRESHOLD = .45;

export async function createNounMatchCriteria(nouns:string[]):Promise<VectorMatchCriteria> {
  const criteria:VectorMatchCriteria = [];
  for(let i = 0; i < nouns.length; ++i) {
    const parts = nouns[i].split('@');
    const phrase = parts[0];
    const acceptanceThreshold = parts.length === 1 ? DEFAULT_ACCEPTANCE_THRESHOLD : parseFloat(parts[1]);
    const vector = await _embedNoun(phrase);
    criteria.push({phrase, vector, acceptanceThreshold});
  }
  return criteria;
}

export async function doesNounMatchCriteria(noun:string, criteria:VectorMatchCriteria):Promise<boolean> {
  const nounVector = await _embedNoun(noun);
  return criteria.some(criterion => compareUnitVectors(nounVector, criterion.vector) >= criterion.acceptanceThreshold);
}