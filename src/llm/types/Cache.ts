type Cache = { [hash:string]: string };

export function isCacheFormat(maybeCache:any): boolean {
  if (!maybeCache || typeof maybeCache !== 'object' || Array.isArray(maybeCache)) return false;
  for (const k of Object.keys(maybeCache)) {
    if (typeof k !== 'string') return false;
    if (typeof maybeCache[k] !== 'string') return false;
  }
  return true;
}

export default Cache;
