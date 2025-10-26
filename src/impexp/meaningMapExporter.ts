import UnitVector from "@/embeddings/types/UnitVector";
import { unitVectorToBytes } from "@/embeddings/vectorUtil";
import MeaningMap from "@/meaningMaps/types/MeaningMap";
import MeaningMapNode from "@/meaningMaps/types/MeaningMapNode";
import { getTextForEmbedding } from "@/replacement/replaceUtil";
import { bytesToBase64 } from "./base64Util";

function _matchThresholdToText(matchThreshold:number):string {
  let numberText = '' + matchThreshold;
  if (numberText.startsWith('0.')) numberText = numberText.substring(1);
  return ` >${numberText}`;
}

function _nodeToHeaderText(node:MeaningMapNode, depth:number):string {
  let concat = '';
  for (let i = 0; i < depth; ++i) {
    concat += '#';
  }
  concat += ' ' + node.description;
  const parentThreshold = node.parent ? node.parent.matchThreshold : -1;
  if (node.matchThreshold !== undefined && node.matchThreshold !== null && node.matchThreshold !== parentThreshold) {
    concat += _matchThresholdToText(node.matchThreshold);
  }
  concat += '\n';
  return concat;
}

type Embedding = {
  sentence:string,
  vector:UnitVector
}

async function _nodeToVectorDescriptionsText(node:MeaningMapNode, embeddings:Embedding[], meaningMap:MeaningMap):Promise<string> {
  let concat = '';
  const { matchVectorDescriptions, matchVectorGroup } = node;
  for(let i = 0; i < matchVectorDescriptions.length; ++i) {
    const description = matchVectorDescriptions[i];
    const vector = matchVectorGroup[i];
    const sentence = await getTextForEmbedding(description, meaningMap.replacers);
    embeddings.push({ sentence, vector });
    concat += `${description}\n`;
  }
  return concat;
}

async function _nodeToTextRecursively(node:MeaningMapNode, embeddings:Embedding[], meaningMap:MeaningMap, depth:number = 0):Promise<string> {
  let concat = '';
  if (depth !== 0) {
    concat += _nodeToHeaderText(node, depth);
    concat += await _nodeToVectorDescriptionsText(node, embeddings, meaningMap);
  }
  for(let i = 0; i < node.children.length; ++i) {
    const childNode = node.children[i];
    concat += await _nodeToTextRecursively(childNode, embeddings, meaningMap, depth+1);
  }
  return concat;
}

function _unitVectorToBase64String(vector:UnitVector):string {
  const bytes = unitVectorToBytes(vector);
  return bytesToBase64(bytes);
}

function _embeddingsToText(embeddings:Embedding[]):string {
  if (!embeddings.length) return '';
  let concat = '<!-- embeddings below are generated automatically - do not edit\n';
  embeddings.forEach(embedding => {
    const vectorBase64 = _unitVectorToBase64String(embedding.vector);
    concat += `${embedding.sentence}=${vectorBase64}\n`;
  });
  concat += '-->';
  return concat;
}

export async function meaningMapToText(meaningMap:MeaningMap, includeEmbeddings:boolean = true):Promise<string> {
  const embeddings:Embedding[] = [];
  let text = await _nodeToTextRecursively(meaningMap.root, embeddings, meaningMap);
  if (includeEmbeddings) text += _embeddingsToText(embeddings);
  return text;
}