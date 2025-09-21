import { assert } from '@/common/assertUtil';
import Meaning from "@/impexp/types/Meaning";
import { findParamsInUtterance, isUtteranceNormalized } from './utteranceUtil';
import { prompt } from '@/llm/llmUtil';
import { findMatchingNShotResponse } from './nShotUtil';

function _doesUtteranceContainAllParams(utterance:string, params:string[]):boolean {
  assert(isUtteranceNormalized(utterance), `Utterance not normalized: "${utterance}"`);
  const utteranceParams = findParamsInUtterance(utterance);
  return params.every(param => utteranceParams.some(u => u === param));
}

export async function evaluateMeaningMatch(utterance:string, meaning:Meaning):Promise<string> {
  const nShotResponse = findMatchingNShotResponse(utterance, meaning.nShotPairs);
  if (nShotResponse) return nShotResponse; // No need to prompt if n-shot already specifies a response.
  if (!_doesUtteranceContainAllParams(utterance, meaning.params)) return 'N'; // Impossible to match if not all params present.
  const SYSTEM_MESSAGE = `User will say a phrase. ` +
    `Output a single letter "Y" for yes, "N" for no, or "M" for maybe ` + 
    `based on your certainty that the user's phrase matches the following rule: ${meaning.promptInstructions}\n` +
    `Do not output more or less than a single letter.`;
  const response = await prompt(utterance, SYSTEM_MESSAGE, meaning.nShotPairs, 2);
  const singleChar = response.trim().toUpperCase().substring(0, 1);
  /* v8 ignore start */ // The false path below is not worth contriving for.
  if (['Y', 'N', 'M'].includes(singleChar)) return singleChar;
  // LLM didn't follow instructions. Just return "maybe" and keep moving.
  return 'M';
}
/* v8 ignore end */