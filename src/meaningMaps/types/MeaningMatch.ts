import ReplacedValues from "@/replacement/types/ReplacedValues";
import MeaningMatchStats from "./MeaningMatchStats";

type MeaningMatch = {
  meaningId:number,
  paramValues:ReplacedValues,
  stats?:MeaningMatchStats
}

export default MeaningMatch;