type MeaningMapRule = {
  followingWords:string[],
  meaningId:string,
  tieBreakIds?:number[] // If specified, the absolute value of each ID is shared with one other rule, and the rule with the positive ID will win a scoring tie over the rule with the matching negative ID.
}

export function duplicateMeaningMapRule(rule:MeaningMapRule):MeaningMapRule {
  return { 
    followingWords: [...rule.followingWords], 
    meaningId: rule.meaningId, 
    tieBreakIds: rule.tieBreakIds === undefined ? undefined : [...rule.tieBreakIds]
  };
}

function _areTieBreakIdsEqual(a?:number[], b?:number[]):boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function areMeaningMapRulesEqual(a:MeaningMapRule, b:MeaningMapRule):boolean {
  if (a.meaningId !== b.meaningId) return false;
  if (a.followingWords.length !== b.followingWords.length) return false;
  for(let i = 0; i < a.followingWords.length; ++i) {
    if (a.followingWords[i] !== b.followingWords[i] || !_areTieBreakIdsEqual(a.tieBreakIds, b.tieBreakIds)) return false;
  }
  return true;
}

export default MeaningMapRule;