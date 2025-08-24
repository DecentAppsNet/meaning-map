import { promises as fs } from 'fs';
import path from 'path';

/* v8 ignore start */

export async function ensureDir(dirPath:string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export async function readJsonFile<T>(filePath:string, defaultValue:T, validator?: (v:any)=>boolean): Promise<T> {
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

export async function readTextFile(filePath:string): Promise<string> {
  const text:string = await fs.readFile(filePath, { encoding: 'utf8' });
  return text;
}

export async function writeJsonFile(filePath:string, data:unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const text = JSON.stringify(data, null, 2);
  // Write atomically by writing to a unique tmp file in same dir, then renaming.
  const suffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const tmp = `${filePath}.tmp-${suffix}`;
  await fs.writeFile(tmp, text, { encoding: 'utf8' });
  try {
    await fs.rename(tmp, filePath);
  } catch (err: any) {
    // On some platforms (Windows) rename may fail if destination is locked.
    // Fall back to copy-then-unlink which is less atomic but more robust.
    try {
      await fs.copyFile(tmp, filePath);
      await fs.unlink(tmp);
    } catch (err2) {
      // If fallback fails, attempt best-effort cleanup and rethrow original error
      try { await fs.unlink(tmp); } catch (_) { /* ignore */ }
      throw err;
    }
  }
}

/* v8 ignore end */
