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

type MatchScore = {
  score:number,
  index:number
}
export function findBestVectorGroupMatchWithStats(vector:UnitVector, vectorGroups:UnitVectorGroup[], certaintyThreshold:number):[foundIndex:number, matchSeparation:number, matchScore:number] {
  if (!vectorGroups.length) return [-1, 0, 0];

  let matchScores:MatchScore[] = vectorGroups // Don't filter on certainty threshold yet, because I need to find the separation with 2nd best.
    .map((vectorGroup, index) => {
      const score = compareVectorToGroup(vector, vectorGroup);
      return { score, index };
    })
    .sort((a, b) => b.score - a.score);
  
  const bestScore = matchScores[0].score;
  const secondBestScore = matchScores.length > 1 ? matchScores[1].score : 0;
  const matchSeparation = bestScore - secondBestScore;

  matchScores = matchScores.filter(ms => ms.score >= certaintyThreshold);
  if (!matchScores.length) return [-1, 0, 0];
  return [matchScores[0].index, matchSeparation, bestScore];
}

export function countVectorsInGroups(vectorGroups:UnitVectorGroup[]):number {
  let total = 0;
  vectorGroups.forEach(group => total += group.length);
  return total;
}