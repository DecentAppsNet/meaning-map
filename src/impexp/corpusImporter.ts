import { readTextFile } from "@/common/fileUtil";

export function parseCorpus(text:string):string[] {
  return text.split("\n").map(line => line.toLowerCase().trim()).filter(line => line.length > 0);
}

/* v8 ignore start */ // Everything important is unit-tested via parseCorpus().
export async function importCorpus(filepath:string):Promise<string[]> {
  const text = await readTextFile(filepath);
  return parseCorpus(text);
}
/* v8 ignore end */