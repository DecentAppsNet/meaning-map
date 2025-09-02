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
    for(let j = i + 1; j < spans.length; ++j) {
      const nextSpan = spans[j];
      if (nextSpan.firstI <= span.lastI + 1) {
        span.lastI = Math.max(span.lastI, nextSpan.lastI);
        ++i; // For next i loop, skip over next span since it was combined into this one.
      } else {
        break; // No more spans to combine with this one.
      }
    }
    combined.push(span);
  }
  return combined;
}