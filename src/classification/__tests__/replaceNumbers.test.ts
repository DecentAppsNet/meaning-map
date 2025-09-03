import { describe, it, expect } from 'vitest';
import { replaceNumbers } from '../replaceNumbers';

describe('replaceNumbers', () => {
  it('returns same text when no numbers present', () => {
    const input = 'i have no numbers here';
    expect(replaceNumbers(input)).toBe(input);
  });

  it('replaces a single number with NUMBER', () => {
    const input = 'i have one apple';
    expect(replaceNumbers(input)).toBe('i have NUMBER apple');
  });

  it('replaces multi-word number sequences with a single NUMBER', () => {
    const input = 'i have one hundred apples';
    expect(replaceNumbers(input)).toBe('i have NUMBER apples');
  });

  it('collapses connecting words between number words into the same NUMBER', () => {
    const input = 'i have one hundred and two things';
    expect(replaceNumbers(input)).toBe('i have NUMBER things');
  });

  it('keeps trailing connecting words when not followed by a number', () => {
    const input = 'i have one hundred and more';
    expect(replaceNumbers(input)).toBe('i have NUMBER and more');
  });

  it('handles multiple connecting words between number words', () => {
    const input = 'i have one hundred and uh three';
    expect(replaceNumbers(input)).toBe('i have NUMBER');
  });

  it('replaces two separate numbers with NUMBER and NUMBER2', () => {
    const input = 'i have one apple and two oranges';
    expect(replaceNumbers(input)).toBe('i have NUMBER apple and NUMBER2 oranges');
  });

  it('replaces multiple-word number sequences separately as NUMBER and NUMBER2', () => {
    const input = 'we bought one hundred and twenty five apples and thirty oranges';
    expect(replaceNumbers(input)).toBe('we bought NUMBER apples and NUMBER2 oranges');
  });

  it('recognizes number prefixes like "number five" and collapses into a single NUMBER', () => {
    const input = 'please give me number five and six';
    // The prefix 'number' causes the following number words to be recognized; lists are collapsed into a single NUMBER
    expect(replaceNumbers(input)).toBe('please give me NUMBER');
  });

  it('recognizes short prefix "num" before a number word', () => {
    const input = 'put this in num twelve';
    expect(replaceNumbers(input)).toBe('put this in NUMBER');
  });

  it('recognizes "#" as a prefix before a number word', () => {
    const input = 'label # three items';
    expect(replaceNumbers(input)).toBe('label NUMBER items');
  });

  it('does not treat a trailing prefix word alone as a number', () => {
    const input = 'please say number';
    expect(replaceNumbers(input)).toBe('please say number');
  });

  it('does not treat a prefix word followed by a non-number word as a number', () => {
    const input = 'please say number apple';
    expect(replaceNumbers(input)).toBe('please say number apple');
  });
});
