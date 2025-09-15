import MeaningMapEntry, { duplicateMeaningMapEntry } from "./MeaningMapEntry";

type MeaningMap = {
  [firstWord:string]:MeaningMapEntry[]
}

export function duplicateMeaningMap(meaningMap:MeaningMap):MeaningMap {
  const result:MeaningMap = {};
  for(const firstWord in meaningMap) {
    result[firstWord] = meaningMap[firstWord].map(duplicateMeaningMapEntry);
  }
  return result;
}

export default MeaningMap;