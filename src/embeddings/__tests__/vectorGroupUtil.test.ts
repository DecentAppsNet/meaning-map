import { describe, it, expect, beforeAll } from 'vitest';
import { compareVectorToGroup, findBestVectorGroupMatch } from "../vectorGroupUtil";
import { embedSentence, isEmbedderInitialized, initEmbedder, embedSentences } from "../../transformersJs/transformersEmbedder";
import UnitVector from "../types/UnitVector";
import UnitVectorGroup from '../types/UnitVectorGroup';

describe('vectorGroupUtil', () => {
  beforeAll(async () => {
    if (!isEmbedderInitialized()) await initEmbedder();
  }, 120000);

  describe('compareVectorToGroup()', () => {
    it('returns 1 for a group with just one vector exactly equal to the checked vector', async () => {
      const vector:UnitVector = await embedSentence('I am a special person.');
      const vectorGroup = [vector];
      expect(compareVectorToGroup(vector, vectorGroup)).toEqual(1);
    });

    it('a similar sentence has good separation from an unrelated one', async () => {
      const vectorGroup = await embedSentences(['i am angry', 'i am furious', 'my mood is angry']);
      const vector = await embedSentence(`i'm livid`);
      const score = compareVectorToGroup(vector, vectorGroup);
      const counterVector = await embedSentence('the sky is blue and the grass is green');
      const counterScore = compareVectorToGroup(counterVector, vectorGroup);
      const separation = score - counterScore;
      expect(separation).toBeGreaterThan(0.2);
    });

    it('a similar sentence has some separation from a lesser-related one', async () => {
      const vectorGroup = await embedSentences(['i am angry', 'i am furious', 'my mood is angry']);
      const vector = await embedSentence(`i'm livid`);
      const score = compareVectorToGroup(vector, vectorGroup);
      const counterVector = await embedSentence('i feel uneasy');
      const counterScore = compareVectorToGroup(counterVector, vectorGroup);
      const separation = score - counterScore;
      expect(separation).toBeGreaterThan(0.1);
    });
  });

  describe('findBestVectorGroupMatch()', () => {
    async function _trySentence(sentence:string, vectorGroups:UnitVectorGroup[]):Promise<number> {
        const vector = await embedSentence(sentence);
        const groupIndex = findBestVectorGroupMatch(vector, vectorGroups, .7);
        return groupIndex;
      }

    it('it classifies utterances to top-level categories', async () => {
      const addingGroup = await embedSentences(['i am adding ITEMS', 'i am adding ITEMS to a container', 
        'i am adding to NUMBER', 'i am adding', 'i am adding ITEMS to NUMBER']);
      const removingGroup = await embedSentences(['i am removing ITEMS', 'i am removing ITEMS from a container',
        'i am removing from NUMBER', 'i am removing', 'i am removing ITEMS from NUMBER']);
      const whereAreItemsGroup = await embedSentences(['where are ITEMS', 'where did i put ITEMS', 'is ITEMS in NUMBER', 'is ITEMS here']);
      const whatsInContainerGroup = await embedSentences(['what is in here', 'what is in NUMBER', 'what do i have in NUMBER']);
      const yesGroup = await embedSentences(['yes', 'i agree', 'confirmed', 'correct']);
      const noGroup = await embedSentences(['no', 'i disagree', 'denied', 'incorrect']);

      const ADDING = 0, REMOVING = 1, WHERE_ARE_ITEMS = 2, WHATS_IN_CONTAINER = 3, YES = 4, NO = 5, NO_MATCH = -1;
      const groups:UnitVectorGroup[] = [addingGroup, removingGroup, whereAreItemsGroup, whatsInContainerGroup, yesGroup, noGroup];

      expect(await _trySentence('i am adding ITEMS to a box', groups)).toEqual(ADDING);
      expect(await _trySentence(`let's put some stuff in NUMBER`, groups)).toEqual(ADDING);
      expect(await _trySentence('i am removing ITEMS from the shelf', groups)).toEqual(REMOVING);
      expect(await _trySentence(`i'm going to yank ITEMS out of NUMBER`, groups)).toEqual(REMOVING);
      expect(await _trySentence('where are ITEMS', groups)).toEqual(WHERE_ARE_ITEMS);
      expect(await _trySentence('where did I put ITEMS yesterday', groups)).toEqual(WHERE_ARE_ITEMS);
      expect(await _trySentence('what is in the box', groups)).toEqual(WHATS_IN_CONTAINER);
      expect(await _trySentence('what do i have in NUMBER', groups)).toEqual(WHATS_IN_CONTAINER);
      expect(await _trySentence('yes, that is correct', groups)).toEqual(YES);
      expect(await _trySentence('i totally agree with you', groups)).toEqual(YES);
      expect(await _trySentence('no, that is not right', groups)).toEqual(NO);
      expect(await _trySentence('nope', groups)).toEqual(NO);
      expect(await _trySentence('i need an umbrella', groups)).toEqual(NO_MATCH);
      expect(await _trySentence('you should go to the store', groups)).toEqual(NO_MATCH);
    });

    it('classifies utterances to fine-grained categories', async () => {
      const addingOnlyGroup = await embedSentences(['i am adding', 'adding stuff', 
        'putting things in', `let's add some stuff`, `i'm adding things`]);
      const addingItemsGroup = await embedSentences(['i am adding ITEMS', 'i am adding ITEMS to a container', 
        `let's add ITEMS`, 'putting ITEMS in']);
      const addingToNumberGroup = await embedSentences(['i am adding to NUMBER', 'add to NUMBER', 
        'NUMBER is where i put this', 'this goes in NUMBER', `let's put things in NUMBER`]);
      const addingItemsToNumberGroup = await embedSentences(['i am adding ITEMS to NUMBER', `let's add ITEMS to NUMBER`, 
        'these ITEMS go in NUMBER', 'this ITEMS goes in NUMBER', 'put ITEMS into NUMBER']);
      
      const ADDING_ONLY = 0, ADDING_ITEMS = 1, ADDING_TO_NUMBER = 2, ADDING_ITEMS_TO_NUMBER = 3, NO_MATCH = -1;
      const groups:UnitVectorGroup[] = [addingOnlyGroup, addingItemsGroup, addingToNumberGroup, addingItemsToNumberGroup];

      expect(await _trySentence('i am adding ITEMS to a box', groups)).toEqual(ADDING_ITEMS);
      expect(await _trySentence(`let's put some stuff in NUMBER`, groups)).toEqual(ADDING_TO_NUMBER);
      expect(await _trySentence('i am adding ITEMS from the shelf', groups)).toEqual(ADDING_ITEMS);
      expect(await _trySentence(`i'm going to add ITEMS`, groups)).toEqual(ADDING_ITEMS);
      expect(await _trySentence('i am adding things', groups)).toEqual(ADDING_ONLY);
      expect(await _trySentence('adding stuff now', groups)).toEqual(ADDING_ONLY);
      expect(await _trySentence('adding ITEMS to NUMBER', groups)).toEqual(ADDING_ITEMS_TO_NUMBER);
      expect(await _trySentence(`let's put all these ITEMS in NUMBER`, groups)).toEqual(ADDING_ITEMS_TO_NUMBER);
      expect(await _trySentence('i need an umbrella', groups)).toEqual(NO_MATCH);
      expect(await _trySentence('you should go to the store', groups)).toEqual(NO_MATCH);
    });
  });
});