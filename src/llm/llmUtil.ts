import NShotPair from "./types/NShotPair";
import LlmMessage from './types/LlmMessage';
import { fetchJsonWithAuth } from '../common/httpUtil';
import { getRequestHash, getCachedResponse, upsertCachedResponse } from './promptCache';

// Defaults (can be overridden via environment variables)
const DEFAULT_STREAM = false;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_OPENAI_URL = process.env.OPENAI_API_BASE ?? 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';

/**
 * Send a prompt to OpenAI Chat Completions using only Node built-ins.
 * Messages are assembled as: [system, n-shot (user, assistant)*, promptMessage]
 *
 * Environment variables used:
 * - OPENAI_API_KEY: required, your OpenAI API key
 * - OPENAI_API_BASE: optional, override base URL (defaults to official API)
 * - OPENAI_MODEL: optional, overrides the model (defaults to gpt-3.5-turbo)
 */
export async function prompt(promptMessage:string, systemMessage:string, nShotPairs:NShotPair[]):Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) throw new Error('OPENAI_API_KEY is not set in environment');

	// Assemble messages: system, then n-shot pairs, then the user's prompt
	const messages: LlmMessage[] = [];
	if (systemMessage && systemMessage.length > 0) {
		messages.push({ role: 'system', content: systemMessage });
	}

	for (const pair of nShotPairs || []) {
		messages.push({ role: 'user', content: pair.userMessage });
		messages.push({ role: 'assistant', content: pair.assistantResponse });
	}

	messages.push({ role: 'user', content: promptMessage });

	// Use cache: compute a request hash and return cached response if present
	const requestHash = getRequestHash(messages);
	const cached = await getCachedResponse(requestHash);
	if (cached !== null) return cached;

	const body = {
		model: DEFAULT_MODEL,
		messages,
		temperature: DEFAULT_TEMPERATURE,
		stream: DEFAULT_STREAM,
	} as Record<string, unknown>;

	const data: any = await fetchJsonWithAuth(DEFAULT_OPENAI_URL, apiKey, body);

	// Chat completion response: choices[0].message.content
	if (data && Array.isArray(data.choices) && data.choices.length > 0) {
		const choice = data.choices[0];
		if (choice.message && typeof choice.message.content === 'string') {
			const out = choice.message.content;
			void upsertCachedResponse(requestHash, out);
			return out;
		}
		// Fallback for text-based completions
		if (typeof choice.text === 'string') {
			const out = choice.text;
			void upsertCachedResponse(requestHash, out);
			return out;
		}
	}

	throw new Error('Unexpected OpenAI response format');
}