type MeaningMapRule = {
  followingWords:string[],
  meaningId:string
}

export function duplicateMeaningMapRule(rule:MeaningMapRule):MeaningMapRule {
  return { followingWords:[...rule.followingWords], meaningId:rule.meaningId };
}

export function areMeaningMapRulesEqual(a:MeaningMapRule, b:MeaningMapRule):boolean {
  if (a.meaningId !== b.meaningId) return false;
  if (a.followingWords.length !== b.followingWords.length) return false;
  for(let i = 0; i < a.followingWords.length; ++i) {
    if (a.followingWords[i] !== b.followingWords[i]) return false;
  }
  return true;
}

export default MeaningMapRule;