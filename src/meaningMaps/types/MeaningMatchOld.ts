import ReplacedValues from "@/replacement/types/ReplacedValues";
import RuleReference from "./RuleReference";

type MeaningMatch = {
  meaningId:string,
  ruleReference:RuleReference,
  paramValues:ReplacedValues
}

export default MeaningMatch;