import { assert } from '../common/assertUtil';
import Meaning from './types/Meaning';
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from './types/MeaningIndex';
import { readTextFile } from '../common/fileUtil';
import { extractAllCapsWords, isDigitChar, isWhiteSpaceChar } from '../common/regExUtil';


function _stripTrailingDot(text:string):string {
  return text.endsWith('.') ? text.slice(0, -1) : text;
}

function _extractParams(description:string):string[] {
  const params = extractAllCapsWords(description);
  return Array.from(new Set(params)); // Exclude redundant params.
}

function _createParentMeaningId(meaningId:string):string {
  const lastDotPos = meaningId.lastIndexOf('.');
  return (lastDotPos === -1) ? UNCLASSIFIED_MEANING_ID : meaningId.substring(0, lastDotPos);
}

function _updateMeaningIdLinks(index:MeaningIndex) {
  const ids:string[] = Object.keys(index);
  // First pass: compute parentMeaningId for every meaning and reset child lists.
  ids.forEach(id => {
    index[id].parentMeaningId = _createParentMeaningId(id);
    index[id].childMeaningIds = [];
  });

  // Second pass: populate child lists for parents that exist and are not UNCLASSIFIED.
  ids.forEach(id => {
    const parentMeaningId = index[id].parentMeaningId;
    if (parentMeaningId === UNCLASSIFIED_MEANING_ID) return;
    const parentMeaning = index[parentMeaningId];
    if (parentMeaning) parentMeaning.childMeaningIds.push(id);
  });
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
      currentMeaning = { meaningId, description, params, promptInstructions: '', nShotPairs: [], parentMeaningId:'', childMeaningIds:[]};
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

  _updateMeaningIdLinks(index);
  return index;
}

/* v8 ignore start */ // Everything important is unit-tested via parseMeaningIndex().
export async function importMeaningIndex(filepath:string):Promise<MeaningIndex> {
  const text = await readTextFile(filepath);
  return parseMeaningIndex(text);
}
/* v8 ignore end */