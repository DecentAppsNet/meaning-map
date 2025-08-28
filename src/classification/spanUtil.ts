import TokenSpan from "./types/TokenSpan";

export function combineAdjacentAndOverlappingTokenSpans(spans:TokenSpan[]):TokenSpan[] {
  if (spans.length <= 1) return spans; // Nothing to combine.
  spans.sort((a, b) => a.firstI - b.firstI);
  const combined:TokenSpan[] = [];
  for (let i = 0; i < spans.length; ++i) {
    const span = {...spans[i]};
    if (i === spans.length - 1) {
      combined.push(span);
      break;
    }
    const nextSpan = spans[i+1];
    if (nextSpan.firstI <= span.lastI + 1) {
      span.lastI = Math.max(span.lastI, nextSpan.lastI);
      ++i; // Skip over next span since it was combined into this one.
    }
    combined.push(span);
  }
  return combined;
}