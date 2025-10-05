import UnitVector from "./types/UnitVector";
import UnitVectorGroup from "./types/UnitVectorGroup";
import { compareUnitVectors } from "./vectorUtil";

export function compareVectorToGroup(vector:UnitVector, vectorGroup:UnitVectorGroup):number {
  let bestScore = 0;
  for(let i = 0; i < vectorGroup.length; ++i) {
    const score = compareUnitVectors(vector, vectorGroup[i]);
    if (score > bestScore) bestScore = score;
  }
  return bestScore;
}

export function findBestVectorGroupMatch(vector:UnitVector, vectorGroups:UnitVectorGroup[], certaintyThreshold:number):number {
  let bestGroupI = -1;
  let bestScore = certaintyThreshold; // Need to beat this to be considered a match.
  for(let groupI = 0; groupI < vectorGroups.length; ++groupI) {
    const score = compareVectorToGroup(vector, vectorGroups[groupI]);
    if (score > bestScore) {
      bestScore = score;
      bestGroupI = groupI;
    }
  }
  return bestGroupI;
}