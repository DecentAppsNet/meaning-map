import Tagger from 'wink-pos-tagger';

let thePosTagger:Tagger|null = null;

function _getPosTagger() {
  if (!thePosTagger) thePosTagger = new Tagger();
  return thePosTagger;
}

export function replaceItems(text:string):string {
  return text; // TODO
}