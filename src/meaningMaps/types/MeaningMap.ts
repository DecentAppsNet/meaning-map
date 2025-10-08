import MeaningMapNode from "./MeaningMapNode";

type MeaningMap = {
  root:MeaningMapNode;
  replacers:string[]; // populated with all unique params found in descriptions
  ids:{[name:string]:number} // names are transformation of description, e.g. "Adding ITEMS to container" -> adding_ITEMS_to_container.
  nodes:{[id:number]:MeaningMapNode} // index into any node
}

export default MeaningMap;