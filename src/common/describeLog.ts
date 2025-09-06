
/* Used for keeping a description of things that happen across many calls without console.log(). */

let theLog:string[] = [];
let theIndentLevel = 0;
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

export function flush():string {
  const result = theLog.join('\n');
  _clearLog();
  return result;
}

export function includes(matchText:string):boolean {
  return theLog.some(line => line.indexOf(matchText) !== -1);
}