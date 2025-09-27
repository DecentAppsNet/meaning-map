import { flushLog } from "../../src/common/describeLog";

let theLastStatusLength = 0;

export function outputStatus(status:string, completedCount:number, totalCount:number) {
  const statusText = `${status} (${completedCount}/${totalCount})`;
  const statusLength = statusText.length;
  if (statusLength < theLastStatusLength) {
    // Clear out any leftover characters from previous status.
    const extraSpaces = ' '.repeat(theLastStatusLength - statusLength);
    process.stdout.write('\r' + statusText + extraSpaces);
  } else {
    process.stdout.write('\r' + statusText);
  }
  if (completedCount >= totalCount) {
    theLastStatusLength = 0;
    process.stdout.write('\n'); // Move to next line when done.
  }
}

export function displayStatusOnUpdate(status:string, completedCount:number, totalCount:number, isVerbose:boolean) {
  if (isVerbose) { 
    const flushed = flushLog();
    if (flushed && flushed.length > 0) {
      process.stdout.write('\n'); // Drop down from status line.
      console.log(flushed);
    }
  }
  outputStatus(status, completedCount, totalCount);
}

export function outputRemainingLogs(isVerbose:boolean) {
  if (!isVerbose) return;
  const flushed = flushLog();
  if (flushed && flushed.length > 0) console.log(flushed);
  theLastStatusLength = 0;
}