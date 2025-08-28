import winkNLP, { WinkMethods } from 'wink-nlp';
import model, { Model } from 'wink-eng-lite-web-model';

// Use a singleton instance of winkNLP to reduce CPU/memory usage.
let theNlp:WinkMethods|null = null; 

export function getNlp():WinkMethods {
  if (!theNlp) {
    theNlp = (winkNLP as unknown as (theModel: Model, pipe?: string[], wordEmbeddings?: unknown) => WinkMethods)(model);
  }
  return theNlp;
}
