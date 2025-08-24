/*
### Meaning Index

Input: Authored.

Lines that begin with #s, e.g. "1." indicate the start of a meaning section. The number is parsed as a meaning ID. 
The remainder of the line as a meaning description.
All-caps words appearing inside the meaning description are parsed as params.

The lines that follow within the meaning section are parsed as follows:
* Prefixed with "USER:" indicates the user prompt of an n-shot pair.
* Prefixed with "ASSISTANT:" indicates the assistant respons of an n-shot pair.
* Any other non-empty line in the meaning section is parsed as agent instructions.

Hierarchies in meaning IDs are used to group utterances first to a more general meaning and potentially to a more specific meaning in a later pass.

Example file:
```
1. Adding
User declares or implies they are adding items to a container.

USER: adding
ASSISTANT: Maybe

USER: adding to bin
ASSISTANT: Yes

USER: let's put some stuff in
ASSISTANT: Yes

USER: let's look at this bin
ASSISTANT: No

USER: should I add something
ASSISTANT: Maybe

1.1. Adding ITEMS
User specifies one or more specific, physical items to add to a container (ITEMS). They do not specify a number that would identify a container.

USER: add a hammer
ASSISTANT: Yes

USER: add a hammer to number seven
ASSISTANT: No
```
*/

import { assert } from '../common/assertUtil';
import Meaning from './types/Meaning';
import MeaningIndex from './types/MeaningIndex';
import { readTextFile } from '../common/fileUtil';
import { extractAllCapsWords, isDigitChar, isWhiteSpaceChar } from '../common/regExUtil';


function _stripTrailingDot(text:string):string {
  return text.endsWith('.') ? text.slice(0, -1) : text;
}


function _extractParams(description:string):string[] {
  const params = extractAllCapsWords(description);
  return Array.from(new Set(params)); // Exclude redundant params.
}

// Parse a numbered heading at the start of the line and return a normalized id
// (no trailing dot) or null if the line does not start with a valid heading.
// Valid examples: "1", "1.", "1.1", "1.1.", "   1.", "1. 1." -> returns "1".
// Invalid examples: "1a.", "1a", "a1." -> return null.
function _parseNumberedHeading(line:string):string|null {
  assert(line.length > 0);
  assert(!isWhiteSpaceChar(line[0])); // Should have been trimmed.

  if (!isDigitChar(line[0])) return null;

  let concat = line[0];
  for(let i = 1; i < line.length; ++i) {
    const c = line[i];
    if (c === '.' || isDigitChar(c)) { concat += c; continue; }
    if (isWhiteSpaceChar(c)) return _stripTrailingDot(concat);
    return null; // Found a non-numbered-heading char before whitespace or end of line.
  }
  return _stripTrailingDot(concat);
}

function _parseDescription(line:string, meaningId:string):string {
  let pos = line.indexOf(meaningId);
  assert(pos !== -1);
  pos += meaningId.length;
  if (line[pos] === '.') ++pos;
  return pos < line.length ? line.slice(pos).trim() : '';
}

const USER_PREFIX = 'USER:';
const ASSISTANT_PREFIX = 'ASSISTANT:';

function _isUserLine(line:string):boolean {
  return line.startsWith(USER_PREFIX);
}

function _isAssistantLine(line:string):boolean {
  return line.startsWith(ASSISTANT_PREFIX);
}

function _parseUserMessage(line:string):string {
  assert(line.length >= USER_PREFIX.length);
  return line.slice(USER_PREFIX.length).trim();
}

function _parseAssistantResponse(line:string):string {
  assert(line.length >= ASSISTANT_PREFIX.length);
  return line.slice(ASSISTANT_PREFIX.length).trim();
}

export function parseMeaningIndex(text:string):MeaningIndex {
  const lines = text.split(/\r?\n/);
  const index:MeaningIndex = {};

  let currentMeaning:Meaning | null = null;

  const _flushCurrentMeaning = () => {
    if (!currentMeaning) return;
    index[currentMeaning.meaningId] = currentMeaning;
    currentMeaning = null;
  };


  for (let lineI = 0; lineI < lines.length; ++lineI) {
    const line = lines[lineI].trim();
    if (line.length === 0) continue; // skip blank lines

    const meaningId = _parseNumberedHeading(line);
    if (meaningId) {
      _flushCurrentMeaning();
      const description = _parseDescription(line, meaningId);
      const params = _extractParams(description);
      currentMeaning = { meaningId, description, params, promptInstructions: '', nShotPairs: []};
      continue;
    }

    if (!currentMeaning) continue; // lines before first heading are ignored
      
    if (_isUserLine(line)) {
      if (lineI >= lines.length || !_isAssistantLine(lines[lineI + 1])) {
        throw new Error(`Invalid USER: line at line ${lineI + 1} is not followed by ASSISTANT:`);
      }
      const userMessage = _parseUserMessage(line);
      const assistantResponse = _parseAssistantResponse(lines[lineI+1]);
      currentMeaning.nShotPairs.push({ userMessage, assistantResponse});
      ++lineI;
      continue;
    }

    // anything else is prompt instructions
    currentMeaning.promptInstructions += (currentMeaning.promptInstructions ? '\n' : '') + line;
  }

  // flush last
  _flushCurrentMeaning();

  return index;
}

/* v8 ignore start */ // Everything important is unit-tested via parseMeaningIndex().
export async function importMeaningIndex(filepath:string):Promise<MeaningIndex> {
  const text = await readTextFile(filepath);
  return parseMeaningIndex(text);
}
/* v8 ignore end */