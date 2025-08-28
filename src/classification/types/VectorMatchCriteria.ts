import UnitVector from "@/embeddings/types/UnitVector";

type VectorMatchCriterion = {
  phrase:string,
  vector:UnitVector,
  acceptanceThreshold:number
}

type VectorMatchCriteria = VectorMatchCriterion[];

export default VectorMatchCriteria;