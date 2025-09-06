import { isEmbedderInitialized } from "@/embeddings/transformersEmbedder";
import UnitVector from "@/embeddings/types/UnitVector";
import { compareUnitVectors } from "@/embeddings/vectorUtil";
import { assert } from '@/common/assertUtil';
import { log } from "@/common/describeLog";
import { createWordCentroid, createWordsCentroid } from "./wordComparisonUtil";

const GENERIC_VERB_TEMPLATES = ["I ___ the box.", "We ___ the box.", "Do you ___ the box?", "They ___ the box."];
async function _createVerbCentroid(verb:string):Promise<UnitVector> {
  return createWordCentroid(verb, GENERIC_VERB_TEMPLATES);
}

let thePlacementVerbsCentroidPromise:Promise<UnitVector>|null = null;
async function _getOrCreatePlacementVerbsCentroid():Promise<UnitVector> {
  if (thePlacementVerbsCentroidPromise) return thePlacementVerbsCentroidPromise;
  const words = ['put', 'place', 'set', 'load', 'pack', 'insert', 'drop', 
    'slide', 'shove', 'toss', 'throw', 'move', 'carry', 'bring', 'take'];
  thePlacementVerbsCentroidPromise = createWordsCentroid(words, GENERIC_VERB_TEMPLATES);
  return thePlacementVerbsCentroidPromise;
}

let theStativeVerbsCentroidPromise:Promise<UnitVector>|null = null;
async function _getOrCreateStativeVerbsCentroid():Promise<UnitVector> {
  if (theStativeVerbsCentroidPromise) return theStativeVerbsCentroidPromise;
  const words = ['have', 'own', 'keep', 'hold', 'see', 'find', 'notice', 'weigh'];
  theStativeVerbsCentroidPromise = createWordsCentroid(words, GENERIC_VERB_TEMPLATES);
  return theStativeVerbsCentroidPromise;
}

export async function isPlacementVerb(verb:string):Promise<boolean> {
  assert(isEmbedderInitialized(), 'Transformers embedder not initialized.');
  const placementVerbsCentroid = await _getOrCreatePlacementVerbsCentroid();
  const stativeVerbsCentroid = await _getOrCreateStativeVerbsCentroid();
  const verbEmbedding = await _createVerbCentroid(verb);
  const placementSimilarity = compareUnitVectors(verbEmbedding, placementVerbsCentroid);
  const stativeSimilarity = compareUnitVectors(verbEmbedding, stativeVerbsCentroid);
  log(`"${verb}" placement similarity: ${placementSimilarity.toFixed(2)}, stative similarity: ${stativeSimilarity.toFixed(2)}, delta: ${(placementSimilarity-stativeSimilarity).toFixed(2)}`); // TODO delete
  return placementSimilarity > stativeSimilarity;
}