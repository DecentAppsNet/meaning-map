import UnitVectorGroup, { duplicateUnitVectorGroup } from "@/embeddings/types/UnitVectorGroup";

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

export function duplicateMeaningMapNode(node:MeaningMapNode, parent:MeaningMapNode|null):MeaningMapNode {
  const nextNode:MeaningMapNode = {
    id: node.id,
    description: node.description,
    params: [...node.params],
    matchVectorGroup: duplicateUnitVectorGroup(node.matchVectorGroup),
    matchThreshold: node.matchThreshold,
    parent,
    children: []
  }
  nextNode.children = node.children.map(c => duplicateMeaningMapNode(c, nextNode));
  return nextNode;
}

export default MeaningMapNode;