type SentenceToken = {
  value:string; // the actual text of the token
  fromPos:number; // position of token in original sentence.
  toPos:number; // position one past end of token in original sentence.
  partOfSpeech:string; // e.g. noun, verb, adjective, adverb, pronoun, determiner, preposition, conjunction.
}

export default SentenceToken;