#!/usr/bin/env tsx
// scripts/mm.ts

import { argsToCommand, Command, findOptionValue, hasOption } from "./helpers/commandUtil";
import ExpectedError from "./helpers/ExpectedError";
import { setOnStatusCallback } from "../src/common/describeLog";
import { createMeaningClassification } from "../src/classification/classifyUtil";
import { createMeaningMap } from "../src/meaningMaps/meaningMapUtil";
import { fileExists, ensureDir } from "../src/common/fileUtil";
import { hasNonPosixFilepathChars } from "../src/common/regExUtil";
import { displayStatusOnUpdate, outputStatus } from "./helpers/outputUtil";
import { initCli } from "./helpers/initializeUtil";

// ANSI text-formatting codes for console output.
const ANSI_START_GREEN = "\x1b[32m";
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

const theAvailableOptions = {
  'c':'corpus',
  'l':'classification',
  'm':'meaning-index',
  'o':'output',
  'v':'verbose'
}

async function _classify(command:Command) {
  const meaningIndexFilepath = findOptionValue(command, 'm');
  const corpusFilepath = findOptionValue(command, 'c');
  const outputFilepath = findOptionValue(command, 'o');
  const isVerbose = hasOption(command, 'v');
  if (!meaningIndexFilepath) throw new ExpectedError('-m|--meaning-index option not followed by filepath.');
  if (!await fileExists(meaningIndexFilepath)) throw new ExpectedError(`Meaning index file not found: ${meaningIndexFilepath}`);
  if (!corpusFilepath) throw new ExpectedError('-c|--corpus option not followed by filepath.');
  if (!await fileExists(corpusFilepath)) throw new ExpectedError(`Corpus file not found: ${corpusFilepath}`);
  if (!outputFilepath) throw new ExpectedError('-o|--output option not followed by filepath.');
  if (hasNonPosixFilepathChars(outputFilepath)) throw new ExpectedError(`Output filepath contains non-posix characters: ${outputFilepath}`);
  await ensureDir(outputFilepath);

  setOnStatusCallback((message, completedCount, totalCount) => {
    displayStatusOnUpdate(message, completedCount, totalCount, isVerbose);
  });

  await initCli();
  await createMeaningClassification(corpusFilepath, meaningIndexFilepath, outputFilepath);
}

async function _map(command:Command) {
  const classificationFilepath = findOptionValue(command, 'l');
  const outputFilepath = findOptionValue(command, 'o');
  const isVerbose = hasOption(command, 'v');
  if (!classificationFilepath) throw new ExpectedError('-l|--classification option not followed by filepath.');
  if (!await fileExists(classificationFilepath)) throw new ExpectedError(`Classification file not found: ${classificationFilepath}`);
  if (!outputFilepath) throw new ExpectedError('-o|--output option not followed by filepath.');
  if (hasNonPosixFilepathChars(outputFilepath)) throw new ExpectedError(`Output filepath contains non-posix characters: ${outputFilepath}`);
  await ensureDir(outputFilepath);

  setOnStatusCallback((message, completedCount, totalCount) => {
    displayStatusOnUpdate(message, completedCount, totalCount, isVerbose);
  });

  await initCli();
  await createMeaningMap(classificationFilepath, outputFilepath);
}

function _help() {
  console.log(`mm classify -m|--meaning-index FILEPATH -c|--corpus FILEPATH -o|--output FILEPATH`);
  console.log(`mm map -l|--classification FILEPATH -o|--output FILEPATH`);
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