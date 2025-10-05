import ExpectedError from "./ExpectedError"

export type CommandOption = {
  optionCode:string,
  optionValue?:string
}

export type Command = {
  commandType:string,
  options:CommandOption[]
}

export type AvailableOptions = {
  [optionCode:string]:string // option name that matches the code, e.g. -c maps to --classification
}

function _findScriptArgIndex(args:string[]):number {
  for(let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (arg.endsWith('.ts') || arg.endsWith('.js')) return i;
  }
  return -1;
}

function _findOptionCodeFromName(optionName:string, availableOptions:AvailableOptions):string|null {
  for(const optionCode in availableOptions) {
    if (availableOptions[optionCode] === optionName) return optionCode;
  }
  return null;
}

export function hasOption(command:Command, optionCode:string):boolean {
  return command.options.some(o => o.optionCode === optionCode);
}

export function findOptionValue(command:Command, optionCode:string):string|undefined {
  const option = command.options.find(o => o.optionCode === optionCode);
  if (!option) throw new ExpectedError(`Missing required option "-${optionCode}".`);
  return option.optionValue;
}

// Expected form: [unpredictable stuff] *.[js|ts] COMMANDTYPE [-OPTION_CODE1[ OPTION_VALUE1]] (0 to n options)
export function argsToCommand(availableOptions:AvailableOptions):Command {
  const args = process.argv;
  const scriptArgI = _findScriptArgIndex(args);
  if (scriptArgI === -1) throw new ExpectedError(`Script missing in command line.`);
  const scriptArgs = args.slice(scriptArgI + 1);
  if (scriptArgs.length === 0) throw new ExpectedError('No command specified.');
  const commandType = scriptArgs[0];
  const options:CommandOption[] = [];
  let currentOption:CommandOption|null = null;
  for(let i = 1; i < scriptArgs.length; ++i) {
    const arg = scriptArgs[i];
    if (arg === '--') break;
    if (arg.startsWith('-')) {
      if (currentOption) options.push(currentOption);
      let optionCode:string|null ;
      if (arg.startsWith('--')) { // long form
        const optionName = arg.slice(2);
        optionCode = _findOptionCodeFromName(optionName, availableOptions);
        if (!optionCode) throw new ExpectedError(`Unknown option name "--${optionName}"`)
      } else { // short form
        optionCode = arg.slice(1);
        if (!availableOptions[optionCode]) throw new Error(`Unknown option code "-${optionCode}"`)
      }
      currentOption = { optionCode };
    } else {
      if (!currentOption) throw new ExpectedError(`Unexpected option value "${arg}" without preceding option code.`);
      if (currentOption.optionValue) throw new ExpectedError(`Multiple values for option code "${currentOption.optionCode}".`);
      currentOption.optionValue = arg;
    }
  }
  if (currentOption) options.push(currentOption);
  return { commandType, options };
}

export function argsAfterScript():string[] {
  const args = process.argv;
  const scriptArgI = _findScriptArgIndex(args);
  if (scriptArgI === -1) throw new ExpectedError(`Script missing in command line.`);
  return args.slice(scriptArgI + 1);
}