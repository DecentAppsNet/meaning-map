import { writeJsonFile } from "@/common/fileUtil";
import MeaningMap from "./types/MeaningMap";
import MeaningMapEntry from "./types/MeaningMapEntry";

type MeaningMapFileFormat = {
  [firstWord:string]:string[]
}

function _entryToFormat(entry:MeaningMapEntry):string {
  return `${entry.followingWords.join(' ').trim()}:${entry.meaningId}`;
}

export function meaningMapToText(meaningMap:MeaningMap):string {
  const firstWords:string[] = Object.keys(meaningMap);
  const format:MeaningMapFileFormat = {};
  firstWords.forEach(firstWord => {
    format[firstWord] = meaningMap[firstWord].map(_entryToFormat);
  });
  return JSON.stringify(format, undefined, 2);
}

/* v8 ignore start */
export async function exportMeaningMap(meaningMap:MeaningMap, filepath:string):Promise<void>  {
  const format = meaningMapToText(meaningMap);
  await writeJsonFile(filepath, format);
}
/* v8 ignore end */