// Response-parsing functions that make no assumptions about text received and are forgiving about formatting.
import { isDigitChar } from "@/common/regExUtil";

// Find first contiguous sequence of digits and return as a number, or -1 if none found.
export function parseNumberFromResponse(response:string):number {
  response = response.trim();
  let startPos = 0;
  while(startPos < response.length && !isDigitChar(response[startPos])) ++startPos;
  if (startPos === response.length) return -1;
  let endPos = startPos + 1;
  while(endPos < response.length && isDigitChar(response[endPos])) ++endPos;
  return parseInt(response.substring(startPos, endPos));
}