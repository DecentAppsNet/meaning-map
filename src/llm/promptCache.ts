import path from 'path';
import crypto from 'crypto';
import LlmMessage from './types/LlmMessage';
import { readJsonFile, writeJsonFile } from '../common/fileUtil';
import Cache, { isCacheFormat } from './types/Cache';

const CACHE_FILENAME = path.resolve(process.cwd(), 'node_modules', '.meaning_map_prompt_cache.json');

let theCache:Cache|null = null;

export function getRequestHash(messages:LlmMessage[]): string {
	// Create a stable string representation and hash it with a fast non-crypto hash (SHA1 ok for collisions here)
	const normalized = messages.map(m => `${m.role}:${m.content}`).join('\n');
	const h = crypto.createHash('sha1').update(normalized, 'utf8').digest('hex');
	return h;
}

export async function getCachedResponse(requestHash:string): Promise<string | null> {
	/* v8 ignore next */
	if (!theCache) theCache = await readJsonFile<Cache>(CACHE_FILENAME, {}, isCacheFormat);
	return theCache[requestHash] ?? null;
}

export async function upsertCachedResponse(requestHash:string, response: string) {
	/* v8 ignore next */
	if (!theCache) theCache = await readJsonFile<Cache>(CACHE_FILENAME, {}, isCacheFormat);
	theCache[requestHash] = response;
	// Fire-and-forget write
	void writeJsonFile(CACHE_FILENAME, theCache).catch((err) => { 
		/* v8 ignore next */
		console.error('Failed to write to prompt cache - ' + err); 
	});
}

export async function clearCache() {
	theCache = {};
	try {
		await writeJsonFile(CACHE_FILENAME, theCache);
	/* v8 ignore start */
	} catch (err) { 
		console.error('Failed to clear prompt cache - ' + err); 
	}
	/* v8 ignore end */
}
