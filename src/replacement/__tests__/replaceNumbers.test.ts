import { describe, it, expect } from 'vitest';
import { replaceNumbers } from '../replaceNumbers';

describe('replaceNumbers', () => {
  it('returns same text when no numbers present', () => {
    const input = 'i have no numbers here';
    expect(replaceNumbers(input)).toEqual([input, {}]);
  });

  it('replaces a single number with NUMBER', () => {
    const input = 'i have one apple';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER apple', {NUMBER: 'one'}]);
  });

  it('replaces multi-word number sequences with a single NUMBER', () => {
    const input = 'i have one hundred apples';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER apples', {NUMBER: 'one hundred'}]);
  });

  it('collapses connecting words between number words into the same NUMBER', () => {
    const input = 'i have one hundred and two things';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER things', {NUMBER: 'one hundred and two'}]);
  });

  it('keeps trailing connecting words when not followed by a number', () => {
    const input = 'i have one hundred and more';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER and more', {NUMBER: 'one hundred'}]);
  });

  it('handles multiple connecting words between number words', () => {
    const input = 'i have one hundred and uh three';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER', {NUMBER: 'one hundred and uh three'}]);
  });

  it('replaces two separate numbers with NUMBER and NUMBER2', () => {
    const input = 'i have one apple and two oranges';
    expect(replaceNumbers(input)).toEqual(['i have NUMBER apple and NUMBER2 oranges', {NUMBER: 'one', NUMBER2: 'two'}]);
  });

  it('replaces multiple-word number sequences separately as NUMBER and NUMBER2', () => {
    const input = 'we bought one hundred and twenty five apples and thirty oranges';
    expect(replaceNumbers(input)).toEqual(['we bought NUMBER apples and NUMBER2 oranges', {NUMBER: 'one hundred and twenty five', NUMBER2: 'thirty'}]);
  });

  it('recognizes number prefixes like "number five" and collapses into a single NUMBER', () => {
    const input = 'please give me number five and six';
    // The prefix 'number' causes the following number words to be recognized; lists are collapsed into a single NUMBER
    expect(replaceNumbers(input)).toEqual(['please give me NUMBER', {NUMBER: 'number five and six'}]);
  });

  it('recognizes short prefix "num" before a number word', () => {
    const input = 'put this in num twelve';
    expect(replaceNumbers(input)).toEqual(['put this in NUMBER', {NUMBER: 'num twelve'}]);
  });

  it('recognizes "#" as a prefix before a number word', () => {
    const input = 'label # three items';
    expect(replaceNumbers(input)).toEqual(['label NUMBER items', {NUMBER: '# three'}]);
  });

  it('does not treat a trailing prefix word alone as a number', () => {
    const input = 'please say number';
    expect(replaceNumbers(input)).toEqual([input, {}]);
  });

  it('does not treat a prefix word followed by a non-number word as a number', () => {
    const input = 'please say number apple';
    expect(replaceNumbers(input)).toEqual([input, {}]);
  });
});
