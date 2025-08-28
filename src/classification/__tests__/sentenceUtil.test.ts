
import { describe, it, expect } from 'vitest';
import { getSentenceTokens, findPrenominalModifiers } from '../sentenceUtil';
import SentenceToken from '../types/SentenceToken';

function _getPrenominalSpan(sentence:string, nounValue:string):string {
  const sentenceTokens:SentenceToken[] = getSentenceTokens(sentence);
  const nounI = sentenceTokens.findIndex(t => t.value.toLowerCase() === nounValue.toLowerCase());
  if (nounI === -1) throw new Error(`noun '${nounValue}' not found in sentence`);
  const firstI = findPrenominalModifiers(sentenceTokens, nounI);
  return sentence.substring(sentenceTokens[firstI].fromPos, sentenceTokens[nounI].toPos);
}

describe('sentenceUtil', () => {
  describe('findPrenominalModifiers()', () => {
    it('includes a noun at beginning of sentence', () => {
      expect(_getPrenominalSpan('apples are great', 'apples')).toBe('apples');
    });

    it('includes a gerund at beginning of sentence', () => {
      expect(_getPrenominalSpan('running water is essential', 'water')).toBe('running water');
    });

    it('includes determiners directly before a noun', () => {
      expect(_getPrenominalSpan('this is the way', 'way')).toBe('the way');
    });

    it('includes adjectives immediately before a noun', () => {
      expect(_getPrenominalSpan('have my red sweater', 'sweater')).toBe('my red sweater');
    });

    it('skips coordinated chunks and picks local adjective modifiers', () => {
      expect(_getPrenominalSpan('tea and bloody taxes', 'taxes')).toBe('bloody taxes');
    });

    it('accumulates multiple adjacent adjectives and determiners', () => {
      expect(_getPrenominalSpan('a long hard winter', 'winter')).toBe('a long hard winter');
    });

    it('accumulates multiple conjunction-joined adjectives', () => {
      expect(_getPrenominalSpan('a long and hard winter', 'winter')).toBe('a long and hard winter');
    });

    it('includes a single preceding possessive', () => {
      expect(_getPrenominalSpan("i am jessie's brother", 'brother')).toBe("jessie's brother");
    });

    it('includes multiple preceding possessive nouns', () => {
      expect(_getPrenominalSpan("i am jessie's uncle's brother", 'brother')).toBe("jessie's uncle's brother");
    });

    it('includes possessives with different apostrophes', () => {
      expect(_getPrenominalSpan("i am jessie’s brother", 'brother')).toBe("jessie’s brother");
      expect(_getPrenominalSpan("i am jesus' brother", 'brother')).toBe("jesus' brother");
      expect(_getPrenominalSpan("i am jesus’ brother", 'brother')).toBe("jesus’ brother");
    }); 

    it('includes proper-noun compounds as modifiers', () => {
      expect(_getPrenominalSpan("can't fight city hall", 'hall')).toBe('city hall');
    });

    it('includes single-word numerals as modifiers', () => {
      expect(_getPrenominalSpan('we want five apples', 'apples')).toBe('five apples');
    });

    it('includes multiple-word numerals as modifiers', () => {
      expect(_getPrenominalSpan('we want fifty five apples', 'apples')).toBe('fifty five apples');
    });

    it('includes multiple-word numerals with conjuctions as modifiers', () => {
      expect(_getPrenominalSpan('we want one hundred and fifty five apples', 'apples')).toBe('one hundred and fifty five apples');
    });

    it('includes multiword proper nouns before a noun', () => {
      expect(_getPrenominalSpan('visited new york city hall', 'hall')).toBe('new york city hall');
    });

    it('includes nouns connected by a preposition', () => {
      expect(_getPrenominalSpan('my bag of marbles is plenty', 'marbles')).toBe('my bag of marbles');
    });

    it('does not include a verb as a gerund when preceded by an auxiliary verb', () => {
      expect(_getPrenominalSpan('is running sword', 'sword')).toBe('sword');
    });

    it('does not include a non-possessive participle as a modifier', () => {
      expect(_getPrenominalSpan('not water', 'water')).toBe('water');
    });

    it('does not include a non-possessive pronoun as a modifier', () => {
      expect(_getPrenominalSpan('they apple', 'apple')).toBe('apple');
    });

    it('does not include a conjunction not preceded by adjective or numeral (granular)', () => {
      expect(_getPrenominalSpan('and apples', 'apples')).toBe('apples');
      expect(_getPrenominalSpan('i like to eat and apples are great', 'apples')).toBe('apples');
    });

    it('does not include ADP when not preceded by a noun (granular)', () => {
      expect(_getPrenominalSpan('with cheese', 'cheese')).toBe('cheese');
      expect(_getPrenominalSpan('it goes under the cheese', 'cheese')).toBe('the cheese');
    });
  });
});
