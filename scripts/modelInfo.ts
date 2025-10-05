import { argsAfterScript } from "./helpers/commandUtil";
import ExpectedError from "./helpers/ExpectedError";
import { isTextBasedModelLoadable } from "../src/transformersJs/modelInfoUtil";
import { flushLog } from "../src/common/describeLog";

// ANSI text-formatting codes for console output.
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

async function _getArgs():Promise<{modelId:string}> {
  const args = argsAfterScript();
  if (args.length < 1) throw new ExpectedError('Need 1 argument after script.');
  const modelId = args[0];
  return { modelId };
}

async function main() {
  const { modelId } = await _getArgs();
  const works = await isTextBasedModelLoadable(modelId);
  console.log(flushLog());
  if (works) {
    console.log(`${ANSI_START_BOLD}Model can be loaded by Transformers.js${ANSI_RESET}`);
  } else {
    console.log(`${ANSI_START_RED}${ANSI_START_BOLD}Model cannot be loaded by Transformers.js${ANSI_RESET}`);
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