
/* Used for keeping a description of things that happen across many calls without console.log(). */

export type OnStatusCallback = (message:string, completedCount:number, totalCount:number) => void;

let theLog:string[] = [];
let theIndentLevel = 0;
let theOnStatus:OnStatusCallback|null = null;

export function setOnStatusCallback(callback:OnStatusCallback|null) {
  theOnStatus = callback;
}

const INDENT = '  ';

function _clearLog() {
  theLog = [];
  theIndentLevel = 0;
}

export function startSection(message:string) {
  log(`${message} {`);
  ++theIndentLevel;
}

export function endSection() {
  --theIndentLevel;
  if(theIndentLevel < 0) {
    console.error('Unbalanced endSection() call. Formatting may not be as intended.');
    theIndentLevel = 0;
  }
  log('}');
}

export function log(message:string) {
  const indent = INDENT.repeat(theIndentLevel);
  theLog.push(indent + message);
}

export function flushLog():string {
  const result = theLog.join('\n');
  _clearLog();
  return result;
}

export function doesLogInclude(matchText:string):boolean {
  return theLog.some(line => line.indexOf(matchText) !== -1);
}

export function setStatus(message:string, completedCount:number, totalCount:number) {
  if (theOnStatus) theOnStatus(message, completedCount, totalCount);
}