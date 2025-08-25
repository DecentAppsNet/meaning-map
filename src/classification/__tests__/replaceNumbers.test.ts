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
});
