export type GetTextForEmbeddingCallback = (replacedUtterance:string) => Promise<string>;
export type ReplaceCallback = (plainUtterance:string) => Promise<string>;

type Replacer = {
  id:string,
  precedesReplacers:string[],
  onGetTextForEmbedding:GetTextForEmbeddingCallback,
  onReplace:ReplaceCallback,
}

export default Replacer;