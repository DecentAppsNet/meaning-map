import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMap";

export const exampleClassifications:MeaningClassifications = {
	"0": ["why are you here", "what is in NUMBER", "you are here why"],
	"1": ["adding ITEMS to NUMBER", "i put ITEMS in ITEMS2", "i need to put ITEMS in here"],
	"1.1": ["should i add more stuff", "do i need to put some stuff in here", "why should i add stuff"],
  "1.2": ["are more things needed to add", "why should i add even more things","should i add even more stuff", "maybe i add even more stuff"],
  "1.3": ["should i actually add even more stuff", "literally should i add even more stuff"],
  "1.4": ["even more stuff is not what i need", "i don't need more stuff"],
  "1.5": ["more stuff should be added", "even more things should be added"]
}

export const exampleMeaningMap:MeaningMap = {
  you: [ { followingWords: [], meaningId: '0' } ],
  what: [ { followingWords: ['NUMBER'], meaningId: '0' } ],
  ITEMS: [
    { followingWords: ['NUMBER'], meaningId: '1' },
    { followingWords: ['ITEMS2'], meaningId: '1' },
    { followingWords: [], meaningId: '1' }
  ],
  do: [ { followingWords: [], meaningId: '1.1' } ],
  why: [ { followingWords: ['stuff'], meaningId: '1.1' }, { followingWords: ['things'], meaningId: '1.2' } ],
  needed: [ { followingWords: [], meaningId: '1.2' } ],
  maybe: [ { followingWords: [], meaningId: '1.2' } ],
  actually: [ { followingWords: [], meaningId: '1.3' } ],
  literally: [ { followingWords: [], meaningId: '1.3' } ],
  not: [ { followingWords: [], meaningId: '1.4' } ],
  "don't": [ { followingWords: [], meaningId: '1.4' } ],
  be: [ { followingWords: [], meaningId: '1.5' } ],
  should: [ { followingWords: [], meaningId: '1.1' } ],
  even: [ { followingWords: [], meaningId: '1.2' } ]
};

/* NEXT
Problem is with postponed words matching by score. There is not enough distinction between matched meanings.

You need some alg like:
check utterance for match against a proposed new meaningmap using matchMeaning()


should i add more stuff 1.1 - postponed because it matches 1.2 and 1.3
should i add even more stuff 1.2 - postponed because it matches 1.3
should i actually add even more stuff 1.3


Terminology - need more concise terms than "full matched utterance" etc.
superset utterance
subset utterance

SubsetUtteranceUtil.ts



#4
add one more match word to superset utterances (restating #1 more generally)
it will be true that adding a match word for a superset utterance will never cause more matches to occur, so you won't break existing rules by doing this.

it will also be true that since all classification utterances are unique, a fully-matched superset utterance will always contain a subset of the words from the subset utterance, 
and therefore unique words will be present to distinguish

the new match word sequence must not match against postponed utterance's words
the addition of an extra match word will cause that rule when matched to score higher than the other rule.

type MatchEntryReference {
  firstWord:string,
  entry:MeaningMapEntry
}

type SubsetUtterance {
  utterance:string,
  meaningId:string,
  supersetUtterances:string[]
}

type UniqueSupersetUtterance {
  utterance:string,
  subsetUtterances:string[]
}

if _findMinimalExclusiveMatchWordsForUtterance() returns null, call new function _findAllSupersetUtterances(utterance:string, classifications):string[].
Store those as supersetUtterances with SubsetUtterance structure.

After finished finding exclusive matches and have postponed utterances, call 
_addMatchWordsToSupersetUtterances(subsetUtterances:SubsetUtterance[], wordUsageMap) {
  convert SubUs to an inverted structure UniqueSupersetUtterance that has every unique superset utterance with one-to-many SubUs
  put SupUs in a queue
  while queue is not empty and iterations without pop is less than queue size (checking for infinity loop)
    peek the first SupU
    find match rule for SubU (MatchEntryReference)
    if not found continue (skip this SupU because it doesn't have a match rule yet - it was postponed)
    pop the first FMU
    _addUniqueMatchWordsForSupersetUtterance(SupU:UniqueSupersetUtterance, SupURef, wordUsageMap)
  assert queue is empty
}

Then for all postponed utterances, add them again, but pass a list of superset utterances that have been fixed by above steps to not conflict. 
Then run _findMinimalExclusiveMatchWordsForUtterance() again, passing the ignore list.

type SupersetWord = {
  word:string,
  index:number, // Position of word within full superset utterance.
  includes:boolean[]
  includeCount:number,
  adding:boolean
}

_addUniqueMatchWordForSupersetUtterance(SupU:UniqueSupersetUtterance, SupURef, wordUsageMap) {
  put words in SupU into SupersetWord[] array
  sort superset words by lowest frequency in wordUsageMap
  for each superset word
    for each subset
      update includes and includeCount members of superset word based on if superset word is included in subset
  sort superset words by includeCount with lowest (0) first
  excludes:boolean[] to track if a PU has been excluded
  for each superset word (sorted by includeCount)
    if adding this superset word would not improve exclusivity continue
    (improving exclusivity means that includes[i] is false and excludes[i] is false for at least one value of i)
    set adding to true
    set excludes[i] to true for all values of i where includes[i] is false
    if all subsets excluded then break from loop
  assert that all subsets are excluded
  update match rule for supURef to include added words
}

*/