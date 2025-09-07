import { assert } from './assertUtil';

export type TextReplacement = {
  fromPos:number;
  toPos:number; // exclusive
  replacementText:string;
}

function _assertReplacementsValid(replacements:TextReplacement[]) { // No side effects!
  for(let i = 0; i < replacements.length; ++i) {
    assert(replacements[i].fromPos < replacements[i].toPos, `Invalid replacement: ${JSON.stringify(replacements[i])}`);
    if (i === 0) continue;
    assert(replacements[i].fromPos >= replacements[i-1].toPos, `Overlapping replacements: ${JSON.stringify(replacements[i-1])} and ${JSON.stringify(replacements[i])}`);
  }
}

function _sortReplacements(replacements:TextReplacement[]) {
  replacements.sort((a, b) => a.fromPos - b.fromPos);
}

export function makeReplacements(text:string, replacements:TextReplacement[]):string {
  if (!replacements.length) return text;
  _sortReplacements(replacements);
  _assertReplacementsValid(replacements);
  let result = '', readPos = 0;
  for(let i = 0; i < replacements.length; ++i) {
    const r = replacements[i];
    result += `${text.substring(readPos, r.fromPos)}${r.replacementText}`;
    assert(r.toPos > r.fromPos);
    readPos = r.toPos;
  }
  result += text.slice(readPos);
  return result;
}
