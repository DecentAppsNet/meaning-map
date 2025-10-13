import { isPlainUtterance } from "@/sentenceParsing/utteranceUtil";
import MeaningMap from "./types/MeaningMap";
import MeaningMatch from "./types/MeaningMatch";
import { assert } from '@/common/assertUtil';
import { makeUtteranceReplacements } from "@/replacement/replaceUtil";
import UnitVector from "@/embeddings/types/UnitVector";
import { embedSentence } from "@/transformersJs/transformersEmbedder";
import { countVectorsInGroups, findBestVectorGroupMatch, findBestVectorGroupMatchWithStats } from "@/embeddings/vectorGroupUtil";
import MeaningMapNode from "./types/MeaningMapNode";
import MeaningMatchStats from "./types/MeaningMatchStats";

function _createMeaningMatchStats():MeaningMatchStats {
  return {
    matchMSecs:0,
    comparisonCount:0,
    nodeStats:{}
  }
}

function _filterNodesByRequiredParams(nodes:MeaningMapNode[], params:string[]):MeaningMapNode[] {
  return nodes.filter(node => {
    return node.params.every(requiredParam => params.includes(requiredParam));
  });
}

async function _findBestMeaningMapNodeRecursively(utteranceVector:UnitVector, currentNode:MeaningMapNode, 
    params:string[], stats?:MeaningMatchStats):Promise<MeaningMapNode> { // TODO - need to exclude nodes from comparison based on params.
  const candidateChildren = _filterNodesByRequiredParams(currentNode.children, params);
  if (!candidateChildren.length) return currentNode;
  const candidateVectorGroups = candidateChildren.map(c => c.matchVectorGroup);
  let candidateI:number;
  if (stats) {
    let childMatchSeparation:number, childMatchScore:number = 0;
    [candidateI, childMatchSeparation, childMatchScore] = findBestVectorGroupMatchWithStats(utteranceVector, candidateVectorGroups, currentNode.matchThreshold);
    stats.nodeStats[currentNode.id] = { id:currentNode.id, childMatchScore, childMatchSeparation };
    stats.comparisonCount += countVectorsInGroups(candidateVectorGroups);
  } else {
    candidateI = findBestVectorGroupMatch(utteranceVector, candidateVectorGroups, currentNode.matchThreshold);
  }
  if (candidateI === -1) return currentNode;
  assert(candidateI >= 0 && candidateI < candidateChildren.length);
  return _findBestMeaningMapNodeRecursively(utteranceVector, candidateChildren[candidateI], params, stats);
}

export async function matchMeaning(plainUtterance:string, meaningMap:MeaningMap):Promise<MeaningMatch|null> {
  assert(isPlainUtterance(plainUtterance));
  const [replacedUtterance, replacedValues] = await makeUtteranceReplacements(plainUtterance, meaningMap.replacers);
  const utteranceVector:UnitVector = await embedSentence(replacedUtterance);
  const bestNode = await _findBestMeaningMapNodeRecursively(utteranceVector, meaningMap.root, Object.keys(replacedValues));
  return bestNode === meaningMap.root ? null : { meaningId:bestNode.id, paramValues:replacedValues };
}

export async function matchMeaningWithStats(plainUtterance:string, meaningMap:MeaningMap):Promise<MeaningMatch|null> {
  assert(isPlainUtterance(plainUtterance));
  const startTime = performance.now();
  const stats:MeaningMatchStats = _createMeaningMatchStats();
  const [replacedUtterance, replacedValues] = await makeUtteranceReplacements(plainUtterance, meaningMap.replacers);
  const utteranceVector:UnitVector = await embedSentence(replacedUtterance);
  const bestNode = await _findBestMeaningMapNodeRecursively(utteranceVector, meaningMap.root, Object.keys(replacedValues), stats);
  stats.matchMSecs = performance.now() - startTime;
  return bestNode === meaningMap.root ? null : { meaningId:bestNode.id, paramValues:replacedValues, stats };
}