import { fileExists, findFiles, readJsonFile, writeTextFile } from "../src/common/fileUtil";
import { InitOption } from "../src/initialization/initUtil";
import { argsAfterScript } from "./helpers/commandUtil";
import ExpectedError from "./helpers/ExpectedError";
import { initCli } from "./helpers/initializeUtil";
import { promptSplitSentences } from "./helpers/promptPunctuate";
import { punctuatedToUtterance } from '../src/classification/utteranceUtil';

// ANSI text-formatting codes for console output.
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

type How100MSplit = {
  start:number[];
  end:number[];
  text:string[];
}
const DEFAULT_HOW_100M_SPLIT: How100MSplit = { start: [], end: [], text: [] };

const MAX_UTTERANCE_LENGTH = 100; // Avoid bringing lengthy sentences into corpus - unlikely to be representative of casual speech.
async function _utteranceGroupToUtterances(utteranceGroup:string):Promise<string[]> {
  const utterances = await promptSplitSentences(utteranceGroup);
  return utterances.filter(u => u.length < MAX_UTTERANCE_LENGTH).map(punctuatedToUtterance)
}

async function _getArgs():Promise<{captionsPath:string}> {
  const args = argsAfterScript();
  if (args.length < 1) throw new ExpectedError('Need 1 argument after script.');
  const captionsPath = args[0];
  return { captionsPath };
}

function _how100mSplitToUtteranceGroup(how100mSplit:How100MSplit):string {
  return how100mSplit.text.join(' ');
}

// Change extension from '.json' to '.txt'.
function _captionsToOutputFilepath(captionsFilepath:string):string {
  if (!captionsFilepath.endsWith('.json')) throw new ExpectedError('Captions filepath must end with .json');
  return captionsFilepath.slice(0, -5) + '.txt';
}

async function _captionFileToCorpus(captionsFilepath:string) {
  const outputFilepath = _captionsToOutputFilepath(captionsFilepath);
  if (await fileExists(outputFilepath)) { console.log(`skipping ${captionsFilepath} - output file already present.`); return; }
  const fileData = await readJsonFile<How100MSplit>(captionsFilepath, DEFAULT_HOW_100M_SPLIT);
  const utteranceGroup = _how100mSplitToUtteranceGroup(fileData);
  const utterances = await _utteranceGroupToUtterances(utteranceGroup);
  const outputText = utterances.join('\n');
  await writeTextFile(outputFilepath, outputText);
}

async function main() {
  const { captionsPath } = await _getArgs();
  await initCli(InitOption.NONE);
  const captionsFilepaths = await findFiles(captionsPath, '.json');
  const START_I = 20, STOP_I = START_I + 100;
  for(let i = START_I; i < STOP_I; ++i) {
    const captionsFilepath = captionsFilepaths[i];
    console.log(`Processing ${i+1}/${captionsFilepaths.length}: ${captionsFilepath}`);
    await _captionFileToCorpus(captionsFilepath);
  }
}

main().catch((error) => {
  error.message = `${ANSI_START_RED}${ANSI_START_BOLD}Error:${ANSI_RESET} ${error.message}`;
  if (error instanceof ExpectedError) { // Message thrown by app code explicitly.
    console.error(error.message);
  } else { // Unexpected error.
    console.error(error); // With the ugly but helpful call stack.
  }
  process.exit(1);
});
