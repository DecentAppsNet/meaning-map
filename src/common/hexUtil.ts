import { assert } from '@/common/assertUtil';

/**
 * Encode a whole number within safe integer min/max as hexadecimal text.
 */
export function numberToHex(value:number):string {
  assert(Number.isFinite(value), 'value must be finite');
  assert(Number.isInteger(value), 'whole numbers only');
  assert(value >= Number.MIN_SAFE_INTEGER, `value ${value} too large to be stored safely`);
  assert(value <= Number.MAX_SAFE_INTEGER, `value ${value} too small to be stored safely`);
  return value.toString(16);
}

/**
 * Decode a hexadecimal string that was produced with numberToHex() and handle invalid
 * strings by throwing.
 *
 * @param {string} hexStr  Hex string, no leading “0x”, optional “-”
 * @returns {number} or throw error for a parsing issue.
 */
const MAX_HEX_STR_CHARS = 15; // Number of chars needed to represent Number.MIN_SAFE_INTEGER ("-1fffffffffffff").
export function hexToNumber(hexStr:string):number {
  hexStr = hexStr.trim();
  if (hexStr.startsWith('0x')) throw new Error('hex string should not start with "0x"');
  const isNegative = hexStr.startsWith('-');
  if (hexStr.length > MAX_HEX_STR_CHARS) throw new Error('hex string too lengthy'); // Avoid parsing a too-large value that might be part of an attack.

  if (isNegative) hexStr = hexStr.slice(1);
  const magnitude = Number('0x' + hexStr); // throws if `hexStr` contains non‑hex chars.
  if (isNaN(magnitude)) throw new Error(`hex string "${hexStr}" does not decode.`);
  if (magnitude === 0 && isNegative) throw new Error('hex string "-0" is not valid.');
  const value = isNegative ? -magnitude : magnitude;
  if (value > Number.MAX_SAFE_INTEGER) throw new Error(`hex string "${hexStr}" is too large to be decoded safely to intended value.`);
  if (value < Number.MIN_SAFE_INTEGER) throw new Error(`hex string "-${hexStr}" is too small to be decoded safely to intended value.`);
  return value;
}