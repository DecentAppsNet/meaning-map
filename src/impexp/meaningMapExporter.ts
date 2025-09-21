import { writeJsonFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMap";
import MeaningMapRule from "./types/MeaningMapRule";

type MeaningMapFileFormat = {
  [firstWord:string]:string[]
}

function _ruleToFormat(rule:MeaningMapRule):string {
  return `${rule.followingWords.join(' ').trim()}:${rule.meaningId}`;
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