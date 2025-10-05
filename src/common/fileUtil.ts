import fs from 'fs/promises';
import { join, extname, resolve, dirname } from 'path';

/* v8 ignore start */

export async function pathExists(filePath:string):Promise<boolean> {
  const dir = dirname(filePath);
  try {
    await fs.access(dir);
    return true;
  } catch (err) {
    return false;
  }
}

export async function ensureDir(dirPath:string):Promise<void> {
  if (await pathExists(dirPath)) return;
  const dir = resolve(dirPath);
  await fs.mkdir(dir, { recursive: true });
}

export async function fileExists(filePath:string):Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

export async function findFiles(dirPath:string, extensionFilter?:string):Promise<string[]> {
  const normalizedExt = extensionFilter ? extensionFilter.replace(/^\./, '').toLowerCase() : null;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile())
    .filter((entry) => {
      if (!normalizedExt) return true; // no filter → keep everything
      const entryExt = extname(entry.name).replace(/^\./, '').toLowerCase();
      return entryExt === normalizedExt;
    })
    .map((entry) => join(dirPath, entry.name));
  return files;
}

export async function readJsonFile<T>(filePath:string, defaultValue:T, validator?:(v:any)=>boolean):Promise<T> {
  try {
    const txt = await fs.readFile(filePath, { encoding: 'utf8' });
    const parsed = JSON.parse(txt);
    if (validator && !validator(parsed)) throw new Error('Invalid format');
    return parsed as T;
  } catch (err: any) {
    // If file doesn't exist or parse fails, return default
    return defaultValue;
  }
}

export async function readTextFile(filePath:string):Promise<string> {
  const text:string = await fs.readFile(filePath, { encoding: 'utf8' });
  return text;
}

async function _fsyncFile(filePath:string):Promise<void> {
  const fd = await fs.open(filePath, 'r');
  try {
    await fd.sync();               
  } finally {
    await fd.close();
  }
}

async function _deleteFileIfExists(filePath:string):Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err; // Ignore if file doesn't exist
  }
}

async function _renameOverwrite(src:string, dest:string):Promise<void> {
  const destStat = await fs.stat(dest).catch(() => null);
  if (destStat?.isDirectory()) throw new Error(`Destination "${dest}" is a directory`);
  await _deleteFileIfExists(dest);
  try {
    await fs.rename(src, dest);
  } catch (err: any) { // Cross‑device move maybe – rename cannot work, so copy instead
    if (err.code === 'EXDEV') {
      await fs.copyFile(src, dest, fs.constants.COPYFILE_FICLONE_FORCE);
      await fs.unlink(src);
    } else {
      throw new Error(`Failed to replace "${dest}": ${err.message}`);
    }
  }
}

export async function writeTextFile(filePath:string, text:string):Promise<void> {
  const dir = dirname(filePath);
  await ensureDir(dir);
  const suffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const tempFilepath = `${filePath}.tmp-${suffix}`;
  
  try {
    await fs.writeFile(tempFilepath, text, { encoding: 'utf8' });
    await _fsyncFile(tempFilepath);                 // optional but safer
    await _renameOverwrite(tempFilepath, filePath);
  } finally {
    await fs.unlink(tempFilepath).catch(() => {});
  }
}

const INDENTATION_CHARS = 2;
export async function writeJsonFile(filePath:string, data:unknown):Promise<void> {
  const text = JSON.stringify(data, null, INDENTATION_CHARS);
  await writeTextFile(filePath, text);
}

/* v8 ignore end */
