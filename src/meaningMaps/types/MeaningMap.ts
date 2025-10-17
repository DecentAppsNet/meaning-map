import Replacer from "../../replacement/types/Replacer";
import MeaningMapNode, { duplicateMeaningMapNode, freezeMeaningMapNode } from "./MeaningMapNode";

type MeaningMap = {
  root:MeaningMapNode;
  replacers:Replacer[]; // populated with replacers for all unique params found in descriptions
  ids:{[name:string]:number} // names are transformation of description, e.g. "Adding ITEMS to container" -> adding_ITEMS_to_container.
  nodes:{[id:number]:MeaningMapNode} // index into any node
}

function _populateNodeIndexRecursively(node:MeaningMapNode, nodes:{[id:number]:MeaningMapNode}) {
  nodes[node.id] = node;
  node.children.forEach(c => _populateNodeIndexRecursively(c, nodes));
}

export function freezeMeaningMap(meaningMap:MeaningMap):void {
  freezeMeaningMapNode(meaningMap.root);
  Object.freeze(meaningMap.replacers);
  Object.freeze(meaningMap.ids);
  Object.freeze(meaningMap.nodes);
  Object.freeze(meaningMap);
}

export function duplicateMeaningMap(meaningMap:MeaningMap):MeaningMap {
  const root = duplicateMeaningMapNode(meaningMap.root, null);
  const replacers = [...meaningMap.replacers];
  const ids:{[name:string]:number} = {};
  Object.keys(meaningMap.ids).forEach(name => { ids[name] = meaningMap.ids[name]; });
  const nodes:{[id:number]:MeaningMapNode} = {};
  _populateNodeIndexRecursively(root, nodes);
  const nextMeaningMap:MeaningMap = {root, replacers, ids, nodes};
  return nextMeaningMap;
}

export default MeaningMap;