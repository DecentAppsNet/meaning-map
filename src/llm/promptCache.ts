import path from 'path';
import crypto from 'crypto';
import LlmMessage from './types/LlmMessage';
import { readJsonFile, writeJsonFile } from '../common/fileUtil';
import Cache, { isCacheFormat } from './types/Cache';
import { assertNonNullable } from '@/common/assertUtil';

let theCache:Cache|null = null;
let theCacheFilename:string|null = null;

export function setModel(modelName:string) {
	const nextCacheFilename = path.resolve(process.cwd(), 'cache', `${modelName}-prompt-cache.json`);
	if (theCacheFilename === nextCacheFilename) return; // No change
	theCache = null;
	theCacheFilename = nextCacheFilename;
}

export function getRequestHash(messages:LlmMessage[]): string {
	// Create a stable string representation and hash it with a fast non-crypto hash (SHA1 ok for collisions here)
	const normalized = messages.map(m => `${m.role}:${m.content}`).join('\n');
	const h = crypto.createHash('sha1').update(normalized, 'utf8').digest('hex');
	return h;
}

export async function getCachedResponse(requestHash:string): Promise<string | null> {
	assertNonNullable(theCacheFilename, 'setModel() must be called before getCachedResponse()');
	/* v8 ignore next */
	if (!theCache) theCache = await readJsonFile<Cache>(theCacheFilename, {}, isCacheFormat);
	return theCache[requestHash] ?? null;
}

export async function upsertCachedResponse(requestHash:string, response: string) {
	assertNonNullable(theCacheFilename, 'setModel() must be called before upsertCachedResponse()');
	/* v8 ignore next */
	if (!theCache) theCache = await readJsonFile<Cache>(theCacheFilename, {}, isCacheFormat);
	theCache[requestHash] = response;
	// Fire-and-forget write
	void writeJsonFile(theCacheFilename, theCache).catch((err) => { 
		/* v8 ignore next */
		console.error('Failed to write to prompt cache - ' + err); 
	});
}

export async function clearCache() {
	assertNonNullable(theCacheFilename, 'setModel() must be called before clearCache()');
	theCache = {};
	try {
		await writeJsonFile(theCacheFilename, theCache);
	/* v8 ignore start */
	} catch (err) { 
		console.error('Failed to clear prompt cache - ' + err); 
	}
	/* v8 ignore end */
}
