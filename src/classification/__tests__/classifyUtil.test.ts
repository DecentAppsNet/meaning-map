import { describe, it } from 'vitest';

import Meaning from '@/impexp/types/Meaning';
import { TestExports } from '../classifyUtil';

describe('classifyUtil', () => {
  describe('_evaluateMeaningMatch', () => {
    const meaning:Meaning = {
      meaningId: '1',
      description: 'Adding',
      params: [],
      parentMeaningId: '0',
      childMeaningIds: [],
      promptInstructions: 'User declares or implies they are adding things to a container.',
      nShotPairs: [
        {userMessage: 'adding', assistantResponse: 'Y'},
        {userMessage: 'adding to bin', assistantResponse: 'Y'},
        {userMessage: "let's put some stuff in", assistantResponse: 'Y'},
        {userMessage: `let's look at this`, assistantResponse: 'N'},
        {userMessage: 'should I add something', assistantResponse: 'M'},
        {userMessage: 'add ITEMS to NUMBER', assistantResponse: 'Y'},
        {userMessage: "i'm putting ITEMS inside", assistantResponse: 'Y'},
        {userMessage: "let's put ITEMS in NUMBER", assistantResponse: 'Y'},
        {userMessage: 'ITEMS go here', assistantResponse: 'M'},
        {userMessage: 'i have NUMBER adding ITEMS', assistantResponse: 'Y'},
        {userMessage: 'adding ITEMS its NUMBER i better stop', assistantResponse: 'Y'},
        {userMessage: 'uh i want i want to put these in', assistantResponse: 'Y'}
      ]
    };
    
    it('benchmark', async () => {
      const utterances:string[] = [`i'm adding`, `let's add`, `time to add stuff`,
        `what goes in this box`, `put it in NUMBER`, `removing`, `not adding now`, `said im not adding i am removing`];
      for(let i = 0; i < utterances.length; ++i) {
        const u = utterances[i];
        const r = await TestExports._evaluateMeaningMatch(u, meaning);
        console.log(`${u} => ${r}`);
      }
    }, 300000);
  });
});