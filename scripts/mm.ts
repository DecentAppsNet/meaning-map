#!/usr/bin/env tsx
// scripts/mm.ts

// TODO either find some commands you want to add here, or delete this file.

import { argsToCommand } from "./helpers/commandUtil";
import ExpectedError from "./helpers/ExpectedError";

// ANSI text-formatting codes for console output.
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

const theAvailableOptions = {
  'v':'verbose'
}

function _help() {
  console.log(`no commands available besides this one`);
}

async function main() {
  const command = argsToCommand(theAvailableOptions);
  switch(command.commandType) {
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