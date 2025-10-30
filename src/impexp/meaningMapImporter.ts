import MeaningMapNode, { UNITIALIZED_VECTOR_GROUP } from "../meaningMaps/types/MeaningMapNode";
import MeaningMap, { freezeMeaningMap } from "../meaningMaps/types/MeaningMap";
import { assert, assertNonNullable } from '@/common/assertUtil';
import { embedSentence, embedSentences } from "@/transformersJs/transformersEmbedder";
import { findParamsInUtterance, isValidUtterance, normalizeUtterance } from "@/sentenceParsing/utteranceUtil";
import { readTextFile } from "@/common/fileUtil";
import Replacer from "@/replacement/types/Replacer";
import { getReplacers, getTextForEmbedding, paramToReplacerId } from "@/replacement/replaceUtil";
import UnitVector from "@/embeddings/types/UnitVector";
import { bytesToUnitVector } from "@/embeddings/vectorUtil";
import { base64ToBytes } from "./base64Util";

const DEFAULT_MATCH_THRESHOLD = .6;

type SentenceToEmbed = {
  sentence:string,
  node:MeaningMapNode
}

function _createRootNode():MeaningMapNode {
  return {
    id: 0,
    description: 'ROOT',
    params: [],
    matchVectorGroup: [],
    matchVectorDescriptions: [],
    matchThreshold: DEFAULT_MATCH_THRESHOLD,
    parent: null,
    children: []
  }
}

function _textToLines(text:string):string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function _getLineDepth(line:string):number {
  let depth = 0;
  while(line[depth] !== ' ' && depth < line.length) {
    if (line[depth] !== '#') return -1; // Invalid syntax.
    ++depth;
  }
  return depth;
}

function _parseMatchThreshold(line:string, matchThresholdPos:number, lineNo:number):number {
  if (matchThresholdPos >= line.length - 1) throw _invalidFormatError(line, lineNo, `">" must be followed by a number.`);
  const matchThresholdStr = line.substring(matchThresholdPos + 1).trim();
  const matchThreshold = Number(matchThresholdStr);
  if (isNaN(matchThreshold) || matchThreshold < 0 || matchThreshold > 1) throw _invalidFormatError(line, lineNo, `">" must be followed by a number between 0 and 1.`);
  return matchThreshold;
}

function _parseHeaderLine(line:string, defaultMatchThresholdId:number, lineNo:number):{description:string, params:string[], matchThreshold:number} {
  const descriptionPos = _getLineDepth(line) + 1;
  let matchThreshold = defaultMatchThresholdId;
  assert(descriptionPos >= 2); // Shortest valid heading would be "# x". Knowing that calling code would have thrown otherwise.
  if (descriptionPos >= line.length) throw _invalidFormatError(line, lineNo, 'header line does not contain a description');
  const matchThresholdPos = line.indexOf('>');
  const description = matchThresholdPos === -1 ? line.substring(descriptionPos) : line.substring(descriptionPos, matchThresholdPos).trim();
  if (matchThresholdPos !== -1) matchThreshold = _parseMatchThreshold(line, matchThresholdPos, lineNo);
  const params = findParamsInUtterance(normalizeUtterance(description));
  return { description, params, matchThreshold };
}

function _addChildNode(headerLine:string, parent:MeaningMapNode, id:number, lineNo:number):MeaningMapNode {
  const {description, params, matchThreshold} = _parseHeaderLine(headerLine, parent.matchThreshold, lineNo);
  const child = { id, description, params, matchVectorDescriptions: [], matchVectorGroup: UNITIALIZED_VECTOR_GROUP, matchThreshold, parent, children: [] };
  parent.children.push(child);
  return child;
}

function _addSiblingNode(headerLine:string, currentNode:MeaningMapNode, id:number, lineNo:number):MeaningMapNode {
  assertNonNullable(currentNode.parent);
  return _addChildNode(headerLine, currentNode.parent, id, lineNo);
}

function _findAncestorNode(currentNode:MeaningMapNode, generationCount:number):MeaningMapNode {
  let hopsLeft = generationCount;
  let node:MeaningMapNode = currentNode;
  while(hopsLeft > 0 && node.parent !== null) {
    node = node.parent;
    --hopsLeft;
  }
  assert(hopsLeft === 0); // From knowledge of calling code, it should be impossible to request a depth smaller than 1.
  return node;
}

function _descriptionToName(description:string):string {
  const utt = normalizeUtterance(description); // Makes casing more consistent.
  return utt.replaceAll(' ', '_');
}

function _invalidFormatError(line:string, lineNo:number, message:string) {
  return new Error(`Line #${lineNo}: "${line}" ${message}.`);
}

function _addNodeToIndexes(node:MeaningMapNode, ids:{[name:string]:number}, nodes:{[id:number]:MeaningMapNode}, lineNo:number) {
  const name = _descriptionToName(node.description);
  if (ids[name] !== undefined) throw _invalidFormatError(node.description, lineNo, 'duplicate description found for heading');
  ids[name] = node.id;
  nodes[node.id] = node;
}

function _addReplacerIdsForNode(node:MeaningMapNode, replacerIds:string[]) {
  node.params.forEach(param => {
    const replacerId = paramToReplacerId(param);
    if (!replacerIds.includes(replacerId)) replacerIds.push(replacerId);
  });
}

async function _getSentencesToEmbed(sentencesToEmbed:SentenceToEmbed[], replacers:Replacer[]):Promise<string[]> {
  const sentences:string[] = [];
  for(const ste of sentencesToEmbed) {
    let sentence = await getTextForEmbedding(ste.sentence, replacers);
    sentences.push(sentence);
  }
  return sentences;
}

async function _getMatchVectorsFromInlineEmbeddings(sentences:string[], inlineEmbeddings:{[sentence:string]:UnitVector}):Promise<UnitVector[]> {
  const vectors:UnitVector[] = [];
  for(const sentence of sentences) {
    let vector = inlineEmbeddings[sentence];
    if (!vector) { 
      console.warn(`Missing inline embedding for sentence "${sentence}". Creating embedding now.`);
      vector = await embedSentence(sentence); // Fallback to embedding if missing.
    }
    vectors.push(vector);
  }
  return vectors;
}

async function _addMatchVectorGroups(sentencesToEmbed:SentenceToEmbed[], replacers:Replacer[], inlineEmbeddings:{[sentence:string]:UnitVector}) {
  const sentences = await _getSentencesToEmbed(sentencesToEmbed, replacers);
  const vectors = Object.keys(inlineEmbeddings).length !== 0 // Use inline embeddings if available to avoid embedding work.
      ? await _getMatchVectorsFromInlineEmbeddings(sentences, inlineEmbeddings) 
      : await embedSentences(sentences);
  assert(vectors.length === sentences.length);
  for(let sentenceI = 0; sentenceI < sentences.length; ++sentenceI) {
    const node = sentencesToEmbed[sentenceI].node;
    if (node.matchVectorGroup === UNITIALIZED_VECTOR_GROUP) node.matchVectorGroup = [];
    node.matchVectorGroup.push(vectors[sentenceI]);
    node.matchVectorDescriptions.push(sentences[sentenceI]);
  }
}

function _addInlineEmbedding(line:string, inlineEmbeddings:{[sentence:string]:UnitVector}, lineNo:number) {
  const equalPos = line.indexOf('=');
  if (equalPos === -1) return; // Not an embedding line.
  const sentence = line.substring(0, equalPos).trim();
  const vectorBase64 = line.substring(equalPos + 1).trim();
  if (!sentence.length || !vectorBase64.length) throw _invalidFormatError(line, lineNo, 'invalid inline embedding format');
  const vectorBytes = base64ToBytes(vectorBase64);
  const vector = bytesToUnitVector(vectorBytes);
  inlineEmbeddings[sentence] = vector;
}

export async function loadMeaningMap(text:string):Promise<MeaningMap> {
  const lines = _textToLines(text);
  let nextId = 1;
  let depth = 0;
  const sentencesToEmbed:SentenceToEmbed[] = [];
  const inlineEmbeddings:{[sentence:string]:UnitVector} = {};
  const root:MeaningMapNode = _createRootNode();
  const replacerIds:string[] = [];
  const ids:{[name:string]:number} = {};
  const nodes:{[id:number]:MeaningMapNode} = {};
  let currentNode = root;
  let inComment = false;
  _addNodeToIndexes(root, ids, nodes, 0);
  for(let lineI = 0; lineI < lines.length; ++lineI) {
    const line = lines[lineI], lineNo = lineI+1;
    if (line.startsWith('<!--')) { inComment = true; continue; }
    if (line.endsWith('-->')) { inComment = false; continue; }
    if (inComment) { _addInlineEmbedding(line, inlineEmbeddings, lineNo); continue; }
    if (line.startsWith('#')) {
      const nextDepth = _getLineDepth(line);
      if (nextDepth === -1) throw _invalidFormatError(line, lineNo, 'invalid section header syntax');
      const depthDelta = nextDepth - depth;
      if (depthDelta > 1) throw _invalidFormatError(line, lineNo, 'increases in depth by more than one');
      if (depthDelta === 1) {
        currentNode = _addChildNode(line, currentNode, nextId++, lineNo);
      } else if (depthDelta === 0) {
        currentNode = _addSiblingNode(line, currentNode, nextId++, lineNo);
      } else {
        assert(depthDelta < 0);
        currentNode = _findAncestorNode(currentNode, -depthDelta + 1);
        currentNode = _addChildNode(line, currentNode, nextId++, lineNo);
      }
      _addReplacerIdsForNode(currentNode, replacerIds);
      _addNodeToIndexes(currentNode, ids, nodes, lineNo);
      depth = nextDepth;
    } else {
      if (currentNode === root) throw _invalidFormatError(line, lineNo, 'comes before a section head');
      if (!isValidUtterance(line)) throw _invalidFormatError(line, lineNo, 'is not in expected utterance format');
      sentencesToEmbed.push({sentence:line, node:currentNode});
    }
  }
  const replacers:Replacer[] = getReplacers(replacerIds);
  await _addMatchVectorGroups(sentencesToEmbed, replacers, inlineEmbeddings);
  const meaningMap:MeaningMap = {root, ids, nodes, replacers};
  freezeMeaningMap(meaningMap);
  return meaningMap;
}

/* v8 ignore start */
export async function importMeaningMapFromFile(filepath:string):Promise<MeaningMap> {
  const text = await readTextFile(filepath);
  return loadMeaningMap(text);
}

export async function importMeaningMap(url:string):Promise<MeaningMap> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch meaning map from URL: ${response.status} ${response.statusText}`);
  const text = await response.text();
  return loadMeaningMap(text);
}
/* v8 ignore end */