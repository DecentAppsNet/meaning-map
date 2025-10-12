import ReplacedValues from "./ReplacedValues";

export type GetTextForEmbeddingCallback = (replacedUtterance:string) => Promise<string>;
export type ReplaceCallback = (plainUtterance:string) => Promise<[replacedUtterance:string, ReplacedValues]>;

type Replacer = {
  id:string,
  precedesReplacers:string[],
  onGetTextForEmbedding:GetTextForEmbeddingCallback,
  onReplace:ReplaceCallback,
}

export function duplicateReplacer(replacer:Replacer):Replacer {
  return {
    id: replacer.id,
    precedesReplacers: [...replacer.precedesReplacers],
    onGetTextForEmbedding: replacer.onGetTextForEmbedding,
    onReplace: replacer.onReplace,
  }
}

export default Replacer;