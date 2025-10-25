import { isPlainUtterance, isValidUtterance } from '@/sentenceParsing/utteranceUtil';
import ReplacedValues from './types/ReplacedValues';
import Replacer, { duplicateReplacer } from './types/Replacer';
import ItemsReplacer from './replaceItems';
import NumberReplacer from './replaceNumbers';
import { assert, assertNonNullable } from '@/common/assertUtil';

const theRegisteredReplacers:{[id:string]:Replacer} = {
  [ItemsReplacer.id]:ItemsReplacer,
  [NumberReplacer.id]:NumberReplacer
};

function _combineReplacedValues(fromValues:ReplacedValues, intoValues:ReplacedValues) {
  const fromParams = Object.keys(fromValues);
  for(let i = 0; i < fromParams.length; ++i) {
    const fromParam = fromParams[i];
    assert(fromValues[fromParam] !== undefined, `Non-unique param ${fromParam} unexpected. Would overwrite existing value.`);
    intoValues[fromParam] = fromValues[fromParam];
  }
}

/** Register a replacer to make it available for use. This can be used by calling code to extend the library
 *  with custom replacers.
 * 
 * Params:
 * replacer - Replacer to register.
 * 
 * Throws:
 * Error if a replacer with the same id is already registered.
*/
export function registerReplacer(replacer:Replacer):void {
  if (theRegisteredReplacers[replacer.id]) {
    throw new Error(`Replacer with id ${replacer.id} is already registered.`);
  }
  theRegisteredReplacers[replacer.id] = replacer;
}

export function unregisterReplacer(id:string):void {
  if (!theRegisteredReplacers[id]) return;
  delete theRegisteredReplacers[id];
}

/** Checks if a replacer with the specified id is registered.
 * 
 * Params:
 * id - Id of replacer to check for.
 * Returns:
 * True if a replacer with the specified id is registered, false otherwise.
 */
export function isReplacerRegistered(id:string):boolean {
  return theRegisteredReplacers[id] !== undefined;
}

function _findReplacer(replacers:Replacer[], id:string):number {
  for(let i = 0; i < replacers.length; ++i) {
    if (replacers[i].id === id) return i;
  }
  return -1;
}

function _getReplacersForSorting(replacerIds:string[]):{[id:string]:Replacer} {
  // Get replacers for all passed IDs.
  let replacers:{[id:string]:Replacer} = {};
  for(let i = 0; i < replacerIds.length; ++i) {
    const id = replacerIds[i];
    let replacer = theRegisteredReplacers[id];
    if (!replacer) throw new Error(`No registered replacer for ${id}.`);
    replacer = duplicateReplacer(replacer);
    replacer.precedesReplacers = replacer.precedesReplacers.filter(precedeId => replacerIds.includes(precedeId)); // Prune IDs that aren't relevant.
    replacers[id] = replacer;
  }

  function _addTransitiveIdsRecursively(startReplacer:Replacer, nextReplacer:Replacer) {
    const nextPrecedeIds = [...nextReplacer.precedesReplacers]; // Make a copy so that loop below is unaffected by mutations.
    for(let i = 0; i < nextPrecedeIds.length; ++i) {
      const nextPrecedeId = nextPrecedeIds[i];
      if (nextPrecedeId === startReplacer.id) { 
        console.warn(`Replacer for ${startReplacer.id} has a cyclic dependency that means not all precede rules can be honored.`); 
        continue;
      }
      if (startReplacer !== nextReplacer) {
        if (startReplacer.precedesReplacers.includes(nextPrecedeId)) {
          console.warn(`Replacer for ${nextPrecedeId} has a cyclic dependency that means not all precede rules can be honored.`);
          continue;
        }
        startReplacer.precedesReplacers.push(nextPrecedeId);
      }
      _addTransitiveIdsRecursively(startReplacer, replacers[nextPrecedeId]);
    }
  }

  // Add transitive preceding IDs, e.g. if A < B and B < C thehn A < B, C.
  for(let i = 0; i < replacerIds.length; ++i) {
    const id = replacerIds[i];
    const replacer = replacers[id];
    _addTransitiveIdsRecursively(replacer, replacer);
    Object.freeze(replacer);
  }

  return replacers;
}

/**
 * For specified replacers, verifies they are registered, and returns them in an order that respects sequencing 
 * rules if possible. (Cyclic sequencing rules would make this impossible, in which case a best try is made.)
 * 
 * Params:
 * replacerIds - Ids of replacers to get, in preferred order.
 * 
 * Returns:
 * Array of Replacers in an order that respects sequencing rules if possible.
 */
export function getReplacers(replacerIds:string[]):Replacer[] {
  let replacersForSorting:{[id:string]:Replacer} = _getReplacersForSorting(replacerIds);
  let replacers:Replacer[] = [];
  for(let i = 0; i < replacerIds.length; ++i) {
    const id = replacerIds[i];
    let replacer = replacersForSorting[id];
    assertNonNullable(replacer);
    
    let insertBeforeIndex = replacers.length;
    for(let j = 0; j < replacer.precedesReplacers.length; ++j) {
      const precedeId = replacer.precedesReplacers[j];
      for(let k = 0; k < replacers.length; ++k) {
        const precedeIndex = _findReplacer(replacers, precedeId);
        if (precedeIndex !== -1 && precedeIndex < insertBeforeIndex) insertBeforeIndex = precedeIndex;
      }
    }
    if (insertBeforeIndex === replacers.length) {
      replacers.push(replacer);
    } else {
      replacers.splice(insertBeforeIndex, 0, replacer);
    }
  }
  Object.freeze(replacers);
  return replacers;
}

/**
 * Makes replacements on a plain utterance using the specified replacers.
 * 
 * Params:
 * plainUtterance - Utterance with no replacements made yet. Must be a valid plain utterance.
 * replacers - Replacers to use, in the order they should be applied.
 * 
 * Returns:
 * Tuple of [replacedUtterance, replacedValues].
 */
export async function makeUtteranceReplacements(plainUtterance:string, replacers:Replacer[]):Promise<[replacedUtterance:string, ReplacedValues]> {
  if (!isPlainUtterance(plainUtterance)) throw new Error('Utterance must be a plain utterance with no replacements made yet.');
  const replacedValues:ReplacedValues = {};
  let replacedUtterance = plainUtterance;
  for(let i = 0; i < replacers.length; ++i) {
    const [nextUtterance, nextReplacedValues] = await replacers[i].onReplace(replacedUtterance);
    _combineReplacedValues(nextReplacedValues, replacedValues);
    replacedUtterance = nextUtterance;
  }
  return [replacedUtterance, replacedValues];
}

/**
 * Gets text suitable for embedding from a replaced utterance using the specified replacers. For example, a sentence like "I want FRUIT1 and FRUIT2"
 * might be converted to "I want apples and oranges" for embedding purposes, because apples and oranges are more semantically meaningful than 
 * FRUIT1 and FRUIT2.
 * 
 * Params:
 * replacedUtterance - Utterance with replacements made. Must be a valid utterance.
 * replacers - Replacers to use, in the order they should be applied.
 * 
 * Returns:
 * Text suitable for embedding.
 */
export async function getTextForEmbedding(replacedUtterance:string, replacers:Replacer[]):Promise<string> {
  assert(isValidUtterance(replacedUtterance));
  let text = replacedUtterance;
  for(let i = 0; i < replacers.length; ++i) {
    text = await replacers[i].onGetTextForEmbedding(text);
  }
  return text;
}

export function paramToReplacerId(param:string):string {
  return param.replace(/[0-9]+$/,'');
}