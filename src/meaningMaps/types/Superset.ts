import RuleReference from "./RuleReference";

type Superset = {
  utterance:string,
  ruleReference:RuleReference|null,
  subsetUtterances:string[]
}

export default Superset;
