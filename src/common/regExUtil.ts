// Small regex helpers. Keep names descriptive and functions generic so they can be reused.

const WHITESPACE_CHARS = ` \t\n\r\f\v`;

export function isWhiteSpaceChar(ch:string):boolean {
  return WHITESPACE_CHARS.includes(ch);
}

export function isDigitChar(ch:string):boolean {
  return ch >= '0' && ch <= '9';
}

export function findWhitespace(text:string, startPos:number = 0):number {
  for (let i = Math.max(0, startPos); i < text.length; i++) {
    if (isWhiteSpaceChar(text[i])) return i;
  }
  return -1;
}

export function findNonWhitespace(text:string, startPos:number = 0):number {
  for (let i = Math.max(0, startPos); i < text.length; i++) {
    if (!isWhiteSpaceChar(text[i])) return i;
  }
  return -1;
}




export function extractAllCapsWords(text:string):string[] {
  const out:string[] = [];
  const re = /\b([A-Z]{2,})\b/g;
  let m:RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

export function escapeRegexCharacters(text:string):string {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function createNonGlobalRegex(regex:RegExp):RegExp {
  if (!regex.global) return regex; // No change needed, so return unmodified regex.
  const flags = regex.flags.replace('g', '');
  return new RegExp(regex, flags);
}