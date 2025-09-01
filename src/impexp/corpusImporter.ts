import { normalizeUtterance } from "@/classification/utteranceUtil";
import { readTextFile } from "@/common/fileUtil";

function _normalizeUtterance(utterance:string):string {
  return normalizeUtterance(utterance.toLowerCase()); // Corpus shouldn't include ALLCAPS variables. These may be added later.
}

// Normalize each line, dedupe against other normalized lines, and return as an array of strings, one per line.
export function parseCorpus(text:string):string[] {
  const seen = new Set<string>();
  return text.split("\n").map(_normalizeUtterance).filter(line => {
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