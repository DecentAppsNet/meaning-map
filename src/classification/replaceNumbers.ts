import { assert } from '../common/assertUtil';
import { isUtteranceNormalized } from './utteranceUtil';

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion', 'trillion'];

// Some words that could be between number words that should be ignored. These might
// be the connecting words people intentionalyl use, ("one hundred and two"), 
// interjection noises ("uh"), or mis-recognized words, e.g. speech recognition hears "or"
// when user said "um".
const connectingWords = ['and', 'a', 'uh', 'um', 'or', 'then'];

// Only supporting positive integers between zero and a trillion. This is a loose check that doesn't care about the grammar of numbers or parsing a value, 
// e.g. "two forty" will be considered a number. Lists of multiple numbers will end up being recognized as a single number.
export function replaceNumbers(text:string):string {
  assert(isUtteranceNormalized(text), 'Expected normalized text');
  const words = text.split(' ');
  const outWords:string[] = [];
  let wasInNumber = false;
  let numberCount = 0;
  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    const inNumber = numberWords.includes(word);
    if (inNumber) {
      if (!wasInNumber) {
        ++numberCount;
        outWords.push(numberCount === 1 ? 'NUMBER' : `NUMBER${numberCount}`);
        wasInNumber = true;
      }
    } else {
      if (wasInNumber && connectingWords.includes(word)) {
        // Find next word that is a number.
        let nextWordI = i+1;
        let foundNumberWord = false;
        while (nextWordI < words.length) {
          const nextWord = words[nextWordI];
          foundNumberWord = numberWords.includes(nextWord);
          if (foundNumberWord || !connectingWords.includes(nextWord)) break;
          ++nextWordI;
        }
        if (foundNumberWord) { i = nextWordI; continue; }
      }
      wasInNumber = false;
      outWords.push(word);
    }
  }
  return outWords.join(' ');
}