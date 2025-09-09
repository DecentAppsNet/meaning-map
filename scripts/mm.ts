import { argsToCommand, Command, findOptionValue } from "./helpers/commandUtil";
import ExpectedError from "./helpers/ExpectedError";
import { createMeaningClassification } from "../src/classification/classifyUtil";

// ANSI text-formatting codes for console output.
const ANSI_START_GREEN = "\x1b[32m";
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

const theAvailableOptions = {
  'c':'corpus',
  'l':'classification',
  'm':'meaning-index',
  'o':'output'
}

async function _classify(command:Command) {
  const meaningIndexFilepath = findOptionValue(command, 'm');
  const corpusFilepath = findOptionValue(command, 'c');
  const outputFilepath = findOptionValue(command, 'o');
  if (!meaningIndexFilepath) throw new ExpectedError('-m|--meaning-index option not followed by filepath.');
  if (!corpusFilepath) throw new ExpectedError('-c|--corpus option not followed by filepath.');
  if (!outputFilepath) throw new ExpectedError('-o|--output option not followed by filepath.');
  // await createMeaningClassification(meaningIndexFilepath, corpusFilepath, outputFilepath);
  // NEXT check that the basic command line stuff works. You'll also need...
  // ...some kind of status messages from the long-running functions.
  // meaningMapUtil.ts needs file I/O API.
}

async function _map(command:Command) {
  const meaningIndexFilepath = findOptionValue(command, 'm');
  const classificationFilepath = findOptionValue(command, 'l');
  const outputFilepath = findOptionValue(command, 'o');
  if (!meaningIndexFilepath) throw new ExpectedError('-m|--meaning-index option not followed by filepath.');
  if (!classificationFilepath) throw new ExpectedError('-l|--classification option not followed by filepath.');
  if (!outputFilepath) throw new ExpectedError('-o|--output option not followed by filepath.');
}

function _help() {
  console.log(`mm classify -m|--meaning-index FILEPATH -c|--corpus FILEPATH -o|--output FILEPATH`);
  console.log(`mm map -m|--meaning-index FILEPATH -l|--classification FILEPATH -o|--output FILEPATH`);
}

async function main() {
  const command = argsToCommand(theAvailableOptions);
  switch(command.commandType) {
    case 'classify': await _classify(command); break;
    case 'map': await _map(command); break;
    case 'help': _help(); break;
    default: throw new ExpectedError(`Unrecognized "${command.commandType}" command. Try "mm help" for syntax.`);
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