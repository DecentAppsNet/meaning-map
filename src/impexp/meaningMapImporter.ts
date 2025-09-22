import { readTextFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMap";
import { normalizeUtterance, utteranceToWords } from "@/classification/utteranceUtil";
import { hexToNumber } from "@/common/hexUtil";

function _describeLocation(firstWord:string, ruleNo?:number):string {
  return ruleNo === undefined
    ? `first word "${firstWord}"`
    : `rule #${ruleNo} for first word "${firstWord}"`;
}

function _parseTieBreakIds(text:string):number[] {
  if (text.length === 0) throw new Error('Tie break IDs must not be empty.');
  const idTexts = text.split(',');
  return idTexts.map(hexToNumber);
}

function _parseRule(rule:string, firstWord:string, ruleNo:number) {
  const colonPos = rule.lastIndexOf(':');
  if (colonPos === -1) throw new Error(`${_describeLocation(firstWord, ruleNo)}: Invalid rule (missing ':').`);
  const utterance = normalizeUtterance(rule.slice(0, colonPos));
  const bangPos = rule.indexOf('!', colonPos + 1);
  let tieBreakIds:number[]|undefined;
  try {
    tieBreakIds = bangPos === -1 ? undefined : _parseTieBreakIds(rule.substring(bangPos+1).trim());
  } catch {
    throw new Error(`${_describeLocation(firstWord, ruleNo)}: Malformed tie break IDs.`);
  }
  const meaningId = bangPos === -1 ? rule.slice(colonPos + 1).trim() : rule.substring(colonPos + 1, bangPos).trim();
  if (!meaningId) throw new Error(`${_describeLocation(firstWord, ruleNo)}: Invalid rule (empty meaningId).`);
  const followingWords = utterance === '' ? [] : utteranceToWords(utterance);
  return { followingWords, meaningId, tieBreakIds };
}

function _jsonTextToObject(text:string):Record<string,string> {
  let obj;
  try {
    obj = JSON.parse(text);
    if (!obj || typeof obj !== 'object') throw new Error('Meaning map must be a JSON object');
  } catch(err) {
    throw new Error(`JSON could not be parsed. Error - ${err}`);
  }
  return obj;
}

export function parseMeaningMap(text:string):MeaningMap {
  const obj = _jsonTextToObject(text);
  const meaningMap:MeaningMap = {};
  for (const firstWord of Object.keys(obj)) {
    const rules = obj[firstWord];
    if (!Array.isArray(rules)) throw new Error(`${_describeLocation(firstWord)}: Value must be an array.`);
    meaningMap[firstWord] = rules.map((rule:any, ruleNo) => {
      if (typeof rule !== 'string') throw new Error(`${_describeLocation(firstWord)}: must be a string.`);
      return _parseRule(rule, firstWord, ruleNo);
    });
  }
  return meaningMap;
}

/* v8 ignore start */ // Everything important is unit-tested via parseMeaningIndex().
export async function importMeaningMap(filepath:string):Promise<MeaningMap> {
  const text = await readTextFile(filepath);
  return parseMeaningMap(text);
}
/* v8 ignore end */