import { writeTextFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMapOld";
import MeaningMapRule from "./types/MeaningMapRule";
import { numberToHex } from "@/common/hexUtil";

type MeaningMapFileFormat = {
  [firstWord:string]:string[]
}

function _trumpIdsToFormat(trumpIds?:number[]):string {
  if (!trumpIds) return '';
  return '!' + trumpIds.map(numberToHex).join(',');
}

// E.g. "what is in NUMBER:0", "i put ITEMS in ITEMS2:1!-3a,7f"
function _ruleToFormat(rule:MeaningMapRule):string {
  const trumpIdsText = _trumpIdsToFormat(rule.trumpIds);
  return `${rule.followingWords.join(' ').trim()}:${rule.meaningId}${trumpIdsText}`;
}

export function meaningMapToText(meaningMap:MeaningMap):string {
  const firstWords:string[] = Object.keys(meaningMap);
  const format:MeaningMapFileFormat = {};
  firstWords.forEach(firstWord => {
    format[firstWord] = meaningMap[firstWord].map(_ruleToFormat);
  });
  return JSON.stringify(format, undefined, 2);
}

/* v8 ignore start */
export async function exportMeaningMap(meaningMap:MeaningMap, filepath:string):Promise<void>  {
  const format = meaningMapToText(meaningMap);
  await writeTextFile(filepath, format);
}
/* v8 ignore end */