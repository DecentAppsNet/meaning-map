import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "@/impexp/types/MeaningIndex";
import { prompt } from "@/llm/llmUtil";
import NShotPair from "@/llm/types/NShotPair";
import { combineMeaningNShotPairs } from "./nShotUtil";
import { parseNumberFromResponse } from "@/llm/llmResponseUtil";

function _concatCandidateMeanings(meaningIds:string[], meaningIndex:MeaningIndex):string {
  return meaningIds.map((id, i) => `${i+1} ${meaningIndex[id].promptInstructions}`).join('\n');
}

export async function findBestMeaningMatch(utterance:string, meaningIndex:MeaningIndex, meaningIds:string[]):Promise<string> {
  const candidateMeanings = _concatCandidateMeanings(meaningIds, meaningIndex); 
  const SYSTEM_MESSAGE = `User will say a phrase. ` +
    `Output the prefixing number of the best matching meaning from the following list of candidate meanings: \n` +
    `${candidateMeanings}\n` +
    `If none of the meanings are a good match, output "0". Do not output anything besides a single number.`;
  const nShotPairs:NShotPair[] = combineMeaningNShotPairs(meaningIndex, meaningIds);
  const response = await prompt(utterance, SYSTEM_MESSAGE, nShotPairs, 8);
  const meaningI = parseNumberFromResponse(response) - 1;
  /* v8 ignore start */
  if (meaningI < 0 || meaningI >= meaningIds.length) { 
    console.error('LLM returned invalid response. Continuing with UNCLASSIFIED.'); 
    return UNCLASSIFIED_MEANING_ID; 
  }
  /* v8 ignore end */
  return meaningIds[meaningI];
}