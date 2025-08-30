import { readTextFile } from "@/common/fileUtil";
import path from 'path';

export async function readSetFile(filePath:string):Promise<Set<string>> {
  const text = await readTextFile(filePath);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return new Set(lines);
}

let thePackableSet:Set<string>|null = null;
export async function getPackableSet():Promise<Set<string>> {
  if (!thePackableSet) {
    const filepath = path.resolve(process.cwd(), 'datasets', 'packables.txt');
    thePackableSet = await readSetFile(filepath);
  }
  return thePackableSet;
}