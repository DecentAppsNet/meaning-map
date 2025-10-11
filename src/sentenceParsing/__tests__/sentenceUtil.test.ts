
import { describe, it, expect } from 'vitest';
import { getSentenceTokens, findPrenominalModifiers } from '../sentenceUtil';
import { combineConjunctionConnectedNounGroups } from '../sentenceUtil';
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

    it('contract test: gerund detection when next token is NOUN using constructed tokens', () => {
      const sentenceTokens: any[] = [
        { value: 'running', fromPos: 0, toPos: 7, partOfSpeech: 'VERB' },
        { value: 'water', fromPos: 8, toPos: 13, partOfSpeech: 'NOUN' }
      ];
      const firstI = findPrenominalModifiers(sentenceTokens as any, 1);
      expect(firstI).toBe(0);
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

  describe('combineConjunctionConnectedNounGroups()', () => {
    function nounGroupsFromNames(sentence:string, names:string[]) {
      const sentenceTokens = getSentenceTokens(sentence);
      return names.map(n => {
        const i = sentenceTokens.findIndex(t => t.value.toLowerCase() === n.toLowerCase());
        if (i === -1) throw new Error(`token '${n}' not found`);
        return { firstI: i, lastI: i };
      });
    }

    it('combines two noun groups separated by a conjunction', () => {
      const s = 'I like apples and oranges a lot';
      const groups = nounGroupsFromNames(s, ['apples', 'oranges']);
      const combined = combineConjunctionConnectedNounGroups(getSentenceTokens(s), groups);
      expect(combined.length).toBe(1);
      expect(combined[0].firstI).toBe(groups[0].firstI);
      expect(combined[0].lastI).toBe(groups[1].lastI);
    });

    it('does not combine when the gap token is not a conjunction', () => {
      const s = 'I like apples with oranges sometimes';
      const groups = nounGroupsFromNames(s, ['apples', 'oranges']);
      const combined = combineConjunctionConnectedNounGroups(getSentenceTokens(s), groups);
      expect(combined.length).toBe(2);
      expect(combined[0]).toEqual(groups[0]);
      expect(combined[1]).toEqual(groups[1]);
    });

    it('does not combine when more than one token separates groups', () => {
      const s = 'I like apples some random oranges now';
      const groups = nounGroupsFromNames(s, ['apples', 'oranges']);
      const combined = combineConjunctionConnectedNounGroups(getSentenceTokens(s), groups);
      expect(combined.length).toBe(2);
    });
  });
});
