import { readTextFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMap";
import { normalizeUtterance, utteranceToWords } from "@/classification/utteranceUtil";

function _describeLocation(firstWord:string, entryNo?:number):string {
  return entryNo === undefined
    ? `first word "${firstWord}"`
    : `entry #${entryNo} for first word "${firstWord}"`;
}

function _parseEntry(entry:string, firstWord:string, entryNo:number) {
  const colonPos = entry.lastIndexOf(':');
  if (colonPos === -1) throw new Error(`${_describeLocation(firstWord, entryNo)}: Invalid entry (missing ':').`);
  const utterance = normalizeUtterance(entry.slice(0, colonPos));
  const meaningId = entry.slice(colonPos + 1).trim();
  if (!meaningId) throw new Error(`${_describeLocation(firstWord, entryNo)}: Invalid entry (empty meaningId).`);
  const followingWords = utterance === '' ? [] : utteranceToWords(utterance);
  return { followingWords, meaningId };
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
    const entries = obj[firstWord];
    if (!Array.isArray(entries)) throw new Error(`${_describeLocation(firstWord)}: Value must be an array.`);
    meaningMap[firstWord] = entries.map((entry:any, entryNo) => {
      if (typeof entry !== 'string') throw new Error(`${_describeLocation(firstWord)}: must be a string.`);
      return _parseEntry(entry, firstWord, entryNo);
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