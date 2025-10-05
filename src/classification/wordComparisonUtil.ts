import { assert } from '@/common/assertUtil';
import { embedSentence } from "@/transformersJs/transformersEmbedder";
import UnitVector from "@/embeddings/types/UnitVector";
import { averageUnitVectors, removeProjectionFromUnitVector } from '@/embeddings/vectorUtil';

const theTemplateCentroidPromises:Map<string, Promise<UnitVector>> = new Map();

function _getCachedTemplateCentroidPromise(sentenceTemplates:string[]):Promise<UnitVector>|null {
  const key = JSON.stringify(sentenceTemplates);
  return theTemplateCentroidPromises.get(key) || null;
}

function _setCachedTemplateCentroidPromise(sentenceTemplates:string[], p:Promise<UnitVector>):void {
  const key = JSON.stringify(sentenceTemplates);
  theTemplateCentroidPromises.set(key, p);
}

async function _createTemplateCentroid(sentenceTemplates:string[]):Promise<UnitVector> {
  const vectors:UnitVector[] = [];
  for(let i = 0; i < sentenceTemplates.length; ++i) {
    vectors.push(await embedSentence(sentenceTemplates[i]));
  }
  return sentenceTemplates.length === 1 ? vectors[0] : averageUnitVectors(vectors);
}

async function _getOrCreateTemplateCentroid(sentenceTemplates:string[]):Promise<UnitVector> {
  assert(sentenceTemplates.length > 0);
  const cached = _getCachedTemplateCentroidPromise(sentenceTemplates);
  if (cached) return cached;
  const promise = _createTemplateCentroid(sentenceTemplates);
  _setCachedTemplateCentroidPromise(sentenceTemplates, promise);
  return promise;
}

function _fillInSentenceTemplate(template:string, word:string):string {
  return template.replaceAll('___', word);
}

export async function createWordsCentroid(words:string[], sentenceTemplates:string[], debiasTemplates:string[] = sentenceTemplates):Promise<UnitVector> {
  assert(sentenceTemplates.length > 0 && words.length > 0);
  const templateCentroid = await _getOrCreateTemplateCentroid(debiasTemplates);
  const wordVectors:UnitVector[] = [];
  for(let wordI = 0; wordI < words.length; ++wordI) {
    for(let templateI = 0; templateI < sentenceTemplates.length; ++templateI) {
      const wordSentence = _fillInSentenceTemplate(sentenceTemplates[templateI], words[wordI]);
      wordVectors.push(await embedSentence(wordSentence));
    }
  }
  const wordsCentroid = averageUnitVectors(wordVectors);
  return removeProjectionFromUnitVector(wordsCentroid, templateCentroid); // Debias by removing generic template embedding.
}

export async function createWordCentroid(word:string, sentenceTemplates:string[], debiasTemplates?:string[]):Promise<UnitVector> { // TODO - refactor to separate module along with callees. And add caching.
  return createWordsCentroid([word], sentenceTemplates, debiasTemplates);
}