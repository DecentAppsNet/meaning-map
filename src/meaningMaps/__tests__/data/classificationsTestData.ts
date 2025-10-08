import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import MeaningMap from "@/impexp/types/MeaningMapOld";

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
  why: [ 
    { followingWords: ['stuff'], meaningId: '1.1' }, 
    { followingWords: ['things'], meaningId: '1.2' } 
  ],
  needed: [ { followingWords: [], meaningId: '1.2' } ],
  maybe: [ { followingWords: [], meaningId: '1.2' } ],
  actually: [ { followingWords: [], meaningId: '1.3', trumpIds: [2, 4] } ],
  literally: [ { followingWords: [], meaningId: '1.3', trumpIds: [3, 5] } ],
  not: [ { followingWords: [], meaningId: '1.4' } ],
  "don't": [ { followingWords: [], meaningId: '1.4' } ],
  be: [ { followingWords: [], meaningId: '1.5' } ],
  should: [ 
    { followingWords: ['stuff'], meaningId: '1.1', trumpIds: [-1, -2, -3] },
    { followingWords: ['even'], meaningId: '1.2', trumpIds: [1, -4, -5] }
  ]
};