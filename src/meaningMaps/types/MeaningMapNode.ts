import UnitVectorGroup, { duplicateUnitVectorGroup, freezeUnitVectorGroup } from "@/embeddings/types/UnitVectorGroup";

export const UNITIALIZED_VECTOR_GROUP:UnitVectorGroup = [];

type MeaningMapNode = {
  id:number,
  description:string,
  params:string[], // Any params found in the description.
  matchVectorGroup:UnitVectorGroup,
  matchVectorDescriptions:string[], // Descriptions of the sentences used to create the vectors in matchVectorGroup.
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
    matchVectorDescriptions: [...node.matchVectorDescriptions],
    matchThreshold: node.matchThreshold,
    parent,
    children: []
  }
  nextNode.children = node.children.map(c => duplicateMeaningMapNode(c, nextNode));
  return nextNode;
}

export function freezeMeaningMapNode(node:MeaningMapNode):void {
  Object.freeze(node);
  Object.freeze(node.params);
  Object.freeze(node.children);
  freezeUnitVectorGroup(node.matchVectorGroup);
  node.children.forEach(freezeMeaningMapNode);
}

export default MeaningMapNode;