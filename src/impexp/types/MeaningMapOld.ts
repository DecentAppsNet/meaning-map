import MeaningMapRule, { duplicateMeaningMapRule } from "./MeaningMapRule";

type MeaningMap = {
  [firstWord:string]:MeaningMapRule[]
}

export function duplicateMeaningMap(meaningMap:MeaningMap):MeaningMap {
  const result:MeaningMap = {};
  for(const firstWord in meaningMap) {
    result[firstWord] = meaningMap[firstWord].map(duplicateMeaningMapRule);
  }
  return result;
}

export default MeaningMap;