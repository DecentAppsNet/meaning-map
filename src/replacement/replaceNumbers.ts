import { assert, assertNonNullable } from '../common/assertUtil';
import { isMatchingParam, isValidUtterance, utteranceToWords, wordsToUtterance } from '../sentenceParsing/utteranceUtil';
import ReplacedValues from './types/ReplacedValues';
import Replacer from './types/Replacer';

const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion', 'trillion'];
const prefixWords = ['number', 'num', '#'];

// Some words that could be between number words that should be ignored. These might
// be the connecting words people intentionalyl use, ("one hundred and two"), 
// interjection noises ("uh"), or mis-recognized words, e.g. speech recognition hears "or"
// when user said "um".
const connectingWords = ['and', 'a', 'uh', 'um', 'or', 'then'];

function _isNumberPrefix(word:string, index:number, words:string[]):boolean {
  if (!prefixWords.includes(word)) return false;
  if (index === words.length - 1) return false;
  return numberWords.includes(words[index + 1]);
}

function _addWordToReplacedValue(paramName:string|null, word:string, replacedValues:ReplacedValues) {
  assertNonNullable(paramName);
  const currentValue = replacedValues[paramName];
  const nextValue = currentValue === undefined ? word : `${currentValue} ${word}`;
  replacedValues[paramName] = nextValue;
}

// Only supporting positive integers between zero and a trillion. This is a loose check that doesn't care about the grammar of numbers or parsing a value, 
// e.g. "two forty" will be considered a number. Lists of multiple numbers will end up being recognized as a single number.
export async function replaceNumbers(utterance:string):Promise<[replacedUtterance:string, replacedValues:ReplacedValues]> {
  assert(isValidUtterance(utterance));
  const replacedValues:ReplacedValues = {};
  const words = utteranceToWords(utterance);
  const outWords:string[] = [];
  let wasInNumber = false;
  let numberCount = 0;
  let activeParamName:string|null = null;

  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    let inNumber = numberWords.includes(word);
    if (_isNumberPrefix(word, i, words)) inNumber = true; // "number five" should be treated as a number.
    if (inNumber) {
      if (!wasInNumber) {
        ++numberCount;
        activeParamName = numberCount === 1 ? 'NUMBER' : `NUMBER${numberCount}`;
        outWords.push(activeParamName);
        wasInNumber = true;
      }
      _addWordToReplacedValue(activeParamName, word, replacedValues);
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
        if (foundNumberWord) {
          for(let j = i; j <= nextWordI; ++j) { _addWordToReplacedValue(activeParamName, words[j], replacedValues); }
          i = nextWordI; continue; 
        }
      }
      wasInNumber = false;
      activeParamName = null;
      outWords.push(word);
    }
  }
  const replacedUtterance = wordsToUtterance(outWords);
  return [replacedUtterance, replacedValues];
}

export async function getNumberTextForEmbedding(replacedUtterance:string):Promise<string> {
  assert(isValidUtterance(replacedUtterance));
  const words = utteranceToWords(replacedUtterance);
  const unreplacedWords = words.map(word => {
    return isMatchingParam(word, 'NUMBER') ? 'thirty seven' : word;
  });
  return wordsToUtterance(unreplacedWords);
}

const REPLACER:Replacer = {
  id: 'NUMBER',
  precedesReplacers: [],
  onGetTextForEmbedding: getNumberTextForEmbedding,
  onReplace: replaceNumbers,
}

export default REPLACER;