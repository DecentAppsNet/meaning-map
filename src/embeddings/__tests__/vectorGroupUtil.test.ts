import { describe, it, expect, beforeAll } from 'vitest';
import { compareVectorToGroup, findBestVectorGroupMatch } from "../vectorGroupUtil";
import { embedSentence, isEmbedderInitialized, initEmbedder, embedSentences } from "../../transformersJs/transformersEmbedder";
import UnitVector from "../types/UnitVector";

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
      console.log(`score = ${score}, counterScore = ${counterScore}`);
      const separation = score - counterScore;
      expect(separation).toBeGreaterThan(0.2); // Expect a decent separation between related and unrelated.
    });

    it('a similar sentence has some separation from a lesser-related one', async () => {
      const vectorGroup = await embedSentences(['i am angry', 'i am furious', 'my mood is angry']);
      const vector = await embedSentence(`i'm livid`);
      const score = compareVectorToGroup(vector, vectorGroup);
      const counterVector = await embedSentence('i feel uneasy');
      const counterScore = compareVectorToGroup(counterVector, vectorGroup);
      console.log(`score = ${score}, counterScore = ${counterScore}`);
      const separation = score - counterScore;
      expect(separation).toBeGreaterThan(0.1); // Expect a decent separation between related and unrelated.
    });
  });

  describe('findBestVectorGroupMatch()', () => {
    it('top-level bintopia POC', async () => {
      // User declares or implies they are adding things to a container.
      const addingGroup = await embedSentences([
        'i am adding ITEMS',
        'i am adding ITEMS to a container',
        'i am adding to NUMBER', 
        'i am adding', 
        'i am adding ITEMS to NUMBER'
      ]);
      
      // User declares or implies they are removing things from a container.
      const removingGroup = await embedSentences([
        'i am removing ITEMS',
        'i am removing ITEMS from a container',
        'i am removing from NUMBER',
        'i am removing', 
        'i am removing ITEMS from NUMBER'
      ]);

      // User wants to know location of ITEMS.
      const whereAreItemsGroup = await embedSentences([
        'where are ITEMS',
        'where did i put ITEMS',
        'is ITEMS in NUMBER',
        'is ITEMS here'
      ]);

      // What's in a container
      const whatsInContainerGroup = await embedSentences([
        'what is in here',
        'what is in NUMBER',
        'what do i have in NUMBER'
      ]);

      // Yes
      const yesGroup = await embedSentences([
        'yes',
        'i agree',
        'confirmed',
        'correct'
      ]);

      // No
      const noGroup = await embedSentences([
        'no',
        'i disagree',
        'denied',
        'incorrect'
      ]);

      const descriptions:string[] = ['adding', 'removing', 'where are items', 'what is in container', 'yes', 'no'];
      const vectorGroups:UnitVector[][] = [addingGroup, removingGroup, whereAreItemsGroup, whatsInContainerGroup, yesGroup, noGroup];
      
      async function _trySentence(sentence:string) {
        const vector = await embedSentence(sentence);
        const groupIndex = findBestVectorGroupMatch(vector, vectorGroups, .7);
        console.log(`'${sentence}' => ${groupIndex !== -1 ? descriptions[groupIndex] : 'no match'}`);
      }

      await _trySentence('i am adding ITEMS to a box');
      await _trySentence(`let's put some stuff in NUMBER`);
      await _trySentence('i am removing ITEMS from the shelf');
      await _trySentence(`i'm going to yank ITEMS out of NUMBER`);
      await _trySentence('where are ITEMS');
      await _trySentence('where did I put ITEMS yesterday');
      await _trySentence('what is in the box');
      await _trySentence('what do i have in NUMBER');
      await _trySentence('yes, that is correct');
      await _trySentence('i totally agree with you');
      await _trySentence('no, that is not right');
      await _trySentence('nope');
      await _trySentence('i need an umbrella');
      await _trySentence('you should go to the store');
    });
  });
});