import { prompt } from '../src/llm/llmUtil.ts';
import { readTextFile, writeTextFile } from '../src/common/fileUtil.ts';
import { initCli } from './helpers/initializeUtil.ts';
import NShotPair from '../src/llm/types/NShotPair.ts';
import { getSentenceTokens } from '../src/classification/sentenceUtil.ts';

const ASCII_GREEN = '\u001b[32m';
const ASCII_RED = '\u001b[31m';
const ASCII_RESET = '\u001b[0m';

async function _isPackableObject(noun:string):Promise<boolean> {
  const promptMessage = noun;
  const systemMessage = 'User will say the name of something. ' + 
    'If it is a specific, physical object that could be put inside of a cardboard box, ' + 
    'output the single character "Y". Otherwise output "N".';
  const nShotPairs:NShotPair[] = [
    {userMessage: 'cat', assistantResponse: 'N'},
    {userMessage: 'guitar', assistantResponse: 'Y'},
    {userMessage: 'universe', assistantResponse: 'N'},
    {userMessage: 'happiness', assistantResponse: 'N'},
    {userMessage: 'something', assistantResponse: 'N'},
    {userMessage: 'table', assistantResponse: 'Y'},
    {userMessage: 'wall', assistantResponse: 'N'},
    {userMessage: 'plant', assistantResponse: 'Y'},
    {userMessage: 'aunt betty', assistantResponse: 'N'},
    {userMessage: 'thing', assistantResponse: 'N'}
  ];
  const response = await prompt(promptMessage, systemMessage, nShotPairs);
  return response.trim().toUpperCase().startsWith('Y');
}

async function _importWords(textFilename:string):Promise<string[]> {
  const text = await readTextFile(`./datasets/${textFilename}`);
  const words:string[] = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return words;
}

function _filterDeletedWords(words:string[]):string[] {
  return words.filter(w => w !== 'DELETE');
}

async function _exportWords(words:string[], textFilename:string) {
  const filteredWords = _filterDeletedWords(words);
  const text = filteredWords.join('\n') + '\n';
  await writeTextFile(`./datasets/${textFilename}`, text);
}

function _hasNonAsciiChars(s:string):boolean {
  for(let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) return true;
  }
  return false;
}

function _hasUnwantedChars(s:string):boolean {
  for(let i = 0; i < UNWANTED_CHARS.length; i++) {
    if (s.includes(UNWANTED_CHARS[i])) return true;
  }
  return _hasNonAsciiChars(s);
}

const UNWANTED_CHARS = ['_', '-', '.', `'`, '`', '"', '<', '>'];

const FORCE_TRUE = new Set(['can']);
const FORCE_FALSE = new Set(['iam', 'ive', 'shant', 'theyre', 'cant', 'cannot', 'couldnt', 'dont', 
  'wont', 'isnt', 'arent', 'wasnt', 'werent', 'wouldnt', 'shouldnt', 'youll', 'youre', 'youve',
  'hasnt', 'havent', 'doesnt', 'didnt', 'shouldnt', 'aint']);
async function _isANoun(word:string):Promise<boolean> {
  if (word.length < 2) return false; // skip one-letter words - none of them will qualify for being packable.
  if (_hasUnwantedChars(word)) return false;
  if (FORCE_TRUE.has(word.toLowerCase())) return true; 
  if (FORCE_FALSE.has(word.toLowerCase())) return false;
  const sentence = `The ${word} is here.`;
   const tokens = getSentenceTokens(sentence);
   for( let i = 0; i < tokens.length; i++) {
     const t = tokens[i];
     if (t.value.toLowerCase() === word.toLowerCase()) {
       return t.partOfSpeech === 'NOUN' || t.partOfSpeech === 'PROPN';
     }
   }
   console.log('tokens', tokens);
   console.warn(`Word "${word}" not found in sentence tokens - maybe it was parsed to separate tokens.`);
   return false;
}

async function main() {
  await initCli();

  // let words = (await _importWords('google-10000-english.txt'));
  let words = (await _importWords('vosk-model-small-en-us-0.15.txt'));

  const originalWordCount = words.length;
  for(let i = 0; i < words.length; i++) {
    const isANoun = await _isANoun(words[i]);
    if (!isANoun) words[i] = 'DELETE';
  }
  words = _filterDeletedWords(words);
  console.log(`Filtered to ${words.length} nouns from ${originalWordCount} total words.`);
  
  for(let i = 0; i < words.length; i++) {
    const isPackable = await _isPackableObject(words[i]);
    console.log(`${words.length - i}: ${words[i]}: ${isPackable ? 'PACKABLE' : 'not packable'}`);
    if (!isPackable) words[i] = 'DELETE';
    if (i % 10 === 0) { console.log('Saving...'); await _exportWords(words, 'packables.txt'); }
  }
  words = _filterDeletedWords(words);
  await _exportWords(words, 'packables.txt');

  console.log('Done - final count of "packable" words:', words.length);
}

main();