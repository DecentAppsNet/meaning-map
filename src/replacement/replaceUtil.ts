import { replaceItems, unreplaceItemsWithPlaceholders } from "./replaceItems";
import { replaceNumbers, unreplaceNumbersWithPlaceholders } from "./replaceNumbers";
import ReplacedValues from "./types/ReplacedValues";

const TEST_PREFIX = 'test: ';
export async function makeUtteranceReplacements(utterance:string):Promise<[string, ReplacedValues]> {
  // This logic is coupled to Bintopia. Think about generalizing it later.
  const wasTestPrefixed = utterance.startsWith(TEST_PREFIX);
  let itemsValues:ReplacedValues, numberValues:ReplacedValues;
  [utterance, itemsValues] = await replaceItems(utterance); // Numbers might be part of ITEMS, e.g. "two apples".
  [utterance, numberValues] = replaceNumbers(utterance); // Numbers that aren't part of ITEMS will be NUMBERS.
  if (wasTestPrefixed && !utterance.startsWith(TEST_PREFIX)) utterance = `${TEST_PREFIX}${utterance}`; // Need to preserve test prefix for unit tests to work.
  const replacedValues = {...itemsValues, ...numberValues};
  return [utterance, replacedValues];
}

// Useful for testing.
export function unreplaceWithPlaceholders(utterance:string):string {
  utterance = unreplaceNumbersWithPlaceholders(utterance);
  utterance = unreplaceItemsWithPlaceholders(utterance);
  return utterance;
}