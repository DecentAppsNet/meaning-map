import { readTextFile } from "@/common/fileUtil";

// Normalize line by converting to lower case, trimming whitespace at beginning/end of line, and converting
// any whitespace between words in the line to a single space.
function _normalizeLine(line:string):string {
  return line.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Normalize each line, dedupe against other normalized lines, and return as an array of strings, one per line.
export function parseCorpus(text:string):string[] {
  const seen = new Set<string>();
  return text.split("\n").map(_normalizeLine).filter(line => {
    if (line.length > 0 && !seen.has(line)) {
      seen.add(line);
      return true;
    }
    return false;
  });
}

/* v8 ignore start */ // Everything important is unit-tested via parseCorpus().
export async function importCorpus(filepath:string):Promise<string[]> {
  const text = await readTextFile(filepath);
  return parseCorpus(text);
}
/* v8 ignore end */