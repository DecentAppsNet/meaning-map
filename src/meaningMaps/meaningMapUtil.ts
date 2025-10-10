import { isPlainUtterance } from "@/classification/utteranceUtil";
import MeaningMap from "./types/MeaningMap";
import MeaningMatch from "./types/MeaningMatch";
import { assert } from '@/common/assertUtil';
import { makeUtteranceReplacements } from "@/replacement/replaceUtil";
import UnitVector from "@/embeddings/types/UnitVector";
import { embedSentence } from "@/transformersJs/transformersEmbedder";
import { findBestVectorGroupMatch } from "@/embeddings/vectorGroupUtil";
import MeaningMapNode from "./types/MeaningMapNode";

async function _findBestMeaningMapNodeRecursively(utteranceVector:UnitVector, currentNode:MeaningMapNode):Promise<MeaningMapNode> {
  if (!currentNode.children.length) return currentNode;
  const childVectors = currentNode.children.map(c => c.matchVectorGroup);
  const nextNodeI = findBestVectorGroupMatch(utteranceVector, childVectors, currentNode.matchThreshold);
  if (nextNodeI === -1) return currentNode;
  assert(nextNodeI >= 0 && nextNodeI < currentNode.children.length);
  return _findBestMeaningMapNodeRecursively(utteranceVector, currentNode.children[nextNodeI]);
}

export async function matchMeaning(plainUtterance:string, meaningMap:MeaningMap):Promise<MeaningMatch|null> {
  assert(isPlainUtterance(plainUtterance));
  const [replacedUtterance, replacedValues] = await makeUtteranceReplacements(plainUtterance);
  const utteranceVector:UnitVector = await embedSentence(replacedUtterance);
  const bestNode = await _findBestMeaningMapNodeRecursively(utteranceVector, meaningMap.root);
  return bestNode === meaningMap.root ? null : { meaningId:bestNode.id, paramValues:replacedValues };
}