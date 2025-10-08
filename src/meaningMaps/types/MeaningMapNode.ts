import UnitVectorGroup from "@/embeddings/types/UnitVectorGroup";

export const UNITIALIZED_VECTOR_GROUP:UnitVectorGroup = [];

type MeaningMapNode = {
  id:number,
  description:string,
  params:string[], // Any params found in the description.
  matchVectorGroup:UnitVectorGroup,
  matchThreshold:number, // From the > syntax in header.
  parent:MeaningMapNode|null, // Parent/children relationships indicated by markdown headings.
  children:MeaningMapNode[]
}

export default MeaningMapNode;