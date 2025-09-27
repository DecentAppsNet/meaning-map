type MeaningMapRule = {
  followingWords:string[],
  meaningId:string,
  trumpIds?:number[] // If specified, the absolute value of each ID is shared with one other rule, and the rule with the positive ID will win over the rule with the matching negative ID.
}

export function duplicateMeaningMapRule(rule:MeaningMapRule):MeaningMapRule {
  return { 
    followingWords: [...rule.followingWords], 
    meaningId: rule.meaningId, 
    trumpIds: rule.trumpIds === undefined ? undefined : [...rule.trumpIds]
  };
}

function _areTrumpIdsEqual(a?:number[], b?:number[]):boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function areMeaningMapRulesEqual(a:MeaningMapRule, b:MeaningMapRule):boolean {
  if (a.meaningId !== b.meaningId) return false;
  if (a.followingWords.length !== b.followingWords.length) return false;
  for(let i = 0; i < a.followingWords.length; ++i) {
    if (a.followingWords[i] !== b.followingWords[i] || !_areTrumpIdsEqual(a.trumpIds, b.trumpIds)) return false;
  }
  return true;
}

export default MeaningMapRule;