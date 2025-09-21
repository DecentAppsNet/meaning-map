import { readTextFile } from "@/common/fileUtil";
import MeaningClassifications from "./types/MeaningClassifications";
import { isValidUtterance } from "@/classification/utteranceUtil";
import { isDigitChar } from "@/common/regExUtil";
import { assert } from "console";

function _findNextNonDigitChar(text:string, fromPos:number):number {
  for(let i = fromPos; i < text.length; ++i) {
    if (!isDigitChar(text[i])) return i;
  }
  return text.length;
}

function _findMeaningId(line:string):string|null {
  let concat = '';
  let i = 0;
  while(i < line.length) {
    let nextNonDigitI = _findNextNonDigitChar(line, i);
    if (nextNonDigitI === i) return null; // e.g. "not a section start".
    concat += line.substring(i, nextNonDigitI);
    if (nextNonDigitI === line.length) break; // e.g. "3" or "3.1"

    i = nextNonDigitI;
    const c = line[i];
    if (c === ' ') break; // e.g. "3 Yes" or "3.1 Yes".
    if (c === '.') {
      const afterPeriodChar = i < line.length - 1 ? line[i+1] : 'EOL';
      if (afterPeriodChar === ' ' || afterPeriodChar === 'EOL') break; // e.g. "3. Yes" or "3.".
      if (isDigitChar(afterPeriodChar)) { // e.g. "3.1"
        concat += '.';
        ++i;
        continue;
      }
    }
    return null; // e.g. "3junk" or "3.junk"
  }
  assert(concat.length > 0); // because if there were no digits at all, I would have returned null above.
  return concat;
}

const UNSPECIFIED = '***UNSPECIFIED***';
export function parseMeaningClassifications(text:string):MeaningClassifications {
  const utterancesSoFar:Set<string> = new Set<string>();
  const classifications:MeaningClassifications = {};
  const lines = text.split('\n');
  let meaningId = UNSPECIFIED;
  for(let lineI = 0; lineI < lines.length; ++lineI) {
    const line = lines[lineI].trim();
    if (line === '') continue;
    const nextMeaningId = _findMeaningId(line);
    if (nextMeaningId) {
      meaningId = nextMeaningId;
      if (!classifications[meaningId]) classifications[meaningId] = [];
    } else {
      if (meaningId === UNSPECIFIED) throw new Error(`Utterance found before any meaning ID on line ${lineI+1}: ${line}`);
      if (utterancesSoFar.has(line)) throw new Error(`Duplicate utterance "${line}" found on line ${lineI+1}: ${line}`);
      if (!isValidUtterance(line)) throw new Error(`Invalid utterance "${line}" found on line ${lineI+1}: ${line}`);
      utterancesSoFar.add(line);
      classifications[meaningId].push(line);
    }
  }
  return classifications;
}

/* v8 ignore start */
export async function importMeaningClassifications(filepath:string):Promise<MeaningClassifications> {
  const text = await readTextFile(filepath);
  return parseMeaningClassifications(text);
}
/* v8 ignore end */