import { readTextFile } from "@/common/fileUtil";
import { fetchGetText } from "@/common/httpUtil";
import { getRuntime } from "@/common/runtimeUtil";
import { baseUrl } from "@/common/urlUtil";
import path from 'path';

/* v8 ignore start */
function _isDevServerFileNotFoundText(text:string):boolean {
  return text.toLowerCase().startsWith('<!doctype html>');
}
/* v8 ignore end */

export async function readSetFile(filename:string):Promise<Set<string>> {
  let text:string = '';
  /* v8 ignore start */
  if (getRuntime() === 'browser') {
    const url = baseUrl(`datasets/${filename}`);
    try {
      text = await fetchGetText(url);
    } catch {}
    if (!text.length || _isDevServerFileNotFoundText(text)) {
      throw new Error(`Failed to load dataset file from ${url}. Copy ${filename} from node_modules/meaning-map/datasets to a web-served /datasets folder for your app.`);
    }
  } else {
  /* v8 ignore end */
    const filepath = path.resolve(process.cwd(), 'datasets', filename);
    text = await readTextFile(filepath);
  }
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return new Set(lines);
}

let thePackableSet:Set<string>|null = null;
export async function getPackableSet():Promise<Set<string>> {
  if (!thePackableSet) thePackableSet = await readSetFile('packables.txt');
  return thePackableSet;
}