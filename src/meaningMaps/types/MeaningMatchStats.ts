import MeaningMatchNodeStats from "./MeaningMatchNodeStats"

type MeaningMatchStats = {
  matchMSecs:number,
  comparisonCount:number,
  nodeStats:{[id:number]:MeaningMatchNodeStats}
}

export default MeaningMatchStats;