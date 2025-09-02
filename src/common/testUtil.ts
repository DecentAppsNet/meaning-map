/* v8 ignore start */
let _originalWarn: ((...args: any[]) => void) | undefined;
let _originalError: ((...args: any[]) => void) | undefined;
let _originalLog: ((...args: any[]) => void) | undefined;

export function disableConsoleLog() {
  _originalLog = console.log;
  console.log = () => {};
}

export function reenableConsoleLog() {
  if (_originalLog) console.log = _originalLog;
  _originalLog = undefined;
}

export function disableConsoleError() {
  _originalError = console.error;
  console.error = () => {};
}

export function reenableConsoleError() {
  if (_originalError) console.error = _originalError;
  _originalError = undefined;
}

export function disableConsoleWarn() {
  _originalWarn = console.warn;
  console.warn = () => {};
}

export function reenableConsoleWarn() {
  if (_originalWarn) console.warn = _originalWarn;
  _originalWarn = undefined;
}

export function disableConsole() {
  disableConsoleLog();
  disableConsoleError();
  disableConsoleWarn();
}

export function reenableConsole() {
  reenableConsoleLog();
  reenableConsoleError();
  reenableConsoleWarn();
}
/* v8 ignore end */