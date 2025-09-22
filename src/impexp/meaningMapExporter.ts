import { writeJsonFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMap";
import MeaningMapRule from "./types/MeaningMapRule";
import { numberToHex } from "@/common/hexUtil";

type MeaningMapFileFormat = {
  [firstWord:string]:string[]
}

function _tieBreakIdsToFormat(tieBreakIds?:number[]):string {
  if (!tieBreakIds) return '';
  return '!' + tieBreakIds.map(numberToHex).join(',');
}

// E.g. "what is in NUMBER:0", "i put ITEMS in ITEMS2:1!-3a,7f"
function _ruleToFormat(rule:MeaningMapRule):string {
  const tieBreakIdsText = _tieBreakIdsToFormat(rule.tieBreakIds);
  return `${rule.followingWords.join(' ').trim()}:${rule.meaningId}${tieBreakIdsText}`;
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
  await writeJsonFile(filepath, format);
}
/* v8 ignore end */