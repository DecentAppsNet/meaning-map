import { describe, it, expect } from 'vitest';

import { replaceItems } from "../replaceItems";

describe('replaceItems', () => {

  describe('replaceItems()', () => {
    it('replaces nothing for sentence with no nouns', async () => {
      const expected = [`hi`, {}];
      expect(await replaceItems(`hi`)).toEqual(expected);
    });

    it('replaces a single noun with ITEMS', async () => {
      const expected = [`ITEMS`, {ITEMS:`screwdriver`}];
      expect(await replaceItems(`screwdriver`)).toEqual(expected);
    });

    describe('when parsing sentences with single nouns', () => {
      it('replaces a single noun at end of a sentence with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver`)).toEqual([`i have ITEMS`, {ITEMS: `a screwdriver`}]);
      });

      it('replaces a single noun at beginning of a sentence with ITEMS', async () => {
        expect(await replaceItems(`screwdrivers i definitely have`)).toEqual([`ITEMS i definitely have`, {ITEMS: `screwdrivers`}]);
      });

      it('replaces a single noun in middle of a sentence with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver and you are impressed`)).toEqual([`i have ITEMS and you are impressed`, {ITEMS: `a screwdriver`}]);
      });
      
      it('replaces a compound noun with ITEMS', async () => {
        expect(await replaceItems(`i have a power screwdriver`)).toEqual([`i have ITEMS`, {ITEMS: `a power screwdriver`}]);
      });
    });


    describe('when parsing sentences with multiple nouns', () => {
      it('replaces two different nouns with ITEMS and ITEMS2', async () => {
        expect(await replaceItems(`i have a screwdriver i have a sweater`)).toEqual([`i have ITEMS i have ITEMS2`, {ITEMS: `a screwdriver`, ITEMS2: `a sweater`}]);
      });

      it('replaces two nouns joined by a conjunction with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver and a hammer`)).toEqual([`i have ITEMS`, {ITEMS: `a screwdriver and a hammer`}]);
      });

      it('replaces multiple nouns in a list with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver ruler and wrench`)).toEqual([`i have ITEMS`, {ITEMS: `a screwdriver ruler and wrench`}]);
      });
    });
  
    describe('when parsing sentences with different kinds of physical items', () => {
      it('replaces a single clothing noun with ITEMS', async () => {
        expect(await replaceItems(`i have a sweater`)).toEqual([`i have ITEMS`, {ITEMS: `a sweater`}]);
      });

      it('replaces a single food noun with ITEMS', async () => {
        expect(await replaceItems(`i have a sandwich`)).toEqual([`i have ITEMS`, {ITEMS: `a sandwich`}]);
      });

      it('replaces a single furniture noun with ITEMS', async () => {
        expect(await replaceItems(`i have a chair`)).toEqual([`i have ITEMS`, {ITEMS: `a chair`}]);
      });

      it('replaces a single appliance noun with ITEMS', async () => {
        expect(await replaceItems(`i have a toaster`)).toEqual([`i have ITEMS`, {ITEMS: `a toaster`}]);
      });

      it('replaces a single utensil noun with ITEMS', async () => {
        expect(await replaceItems(`i have a fork`)).toEqual([`i have ITEMS`, {ITEMS: `a fork`}]);
      });

      it('replaces a single tool noun with ITEMS', async () => {
        expect(await replaceItems(`i have a hammer`)).toEqual([`i have ITEMS`, {ITEMS: `a hammer`}]);
      });

      it('replaces a single device noun with ITEMS', async () => {
        expect(await replaceItems(`i have a phone`)).toEqual([`i have ITEMS`, {ITEMS: `a phone`}]);
      });

      it('replaces a single instrument noun with ITEMS', async () => {
        expect(await replaceItems(`i have a guitar`)).toEqual([`i have ITEMS`, {ITEMS: `a guitar`}]);
      });

      it('replaces a single product noun with ITEMS', async () => {
        expect(await replaceItems(`i have a bottle of shampoo`)).toEqual([`i have ITEMS`, {ITEMS: `a bottle of shampoo`}]);
      });

      it('replaces a single package noun with ITEMS', async () => {
        expect(await replaceItems(`i have a box`)).toEqual([`i have ITEMS`, {ITEMS: `a box`}]);
      });

      it('replaces a single equipment noun with ITEMS', async () => {
        expect(await replaceItems(`i have a tent`)).toEqual([`i have ITEMS`, {ITEMS: `a tent`}]);
      });

      it('replaces a single gear noun with ITEMS', async () => {
        expect(await replaceItems(`i have hiking boots`)).toEqual([`i have ITEMS`, {ITEMS: `hiking boots`}]);
      });
    });

    describe('when parsing sentences with nouns that are not specific physical items', () => {
      it('does not replace a single abstract noun', async () => {
        const TEXTS = [`i have an idea`, `i have a thought`, `i have a suggestion`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual([text, {}]);
        });
      });

      it('does not replace an unspecific description of an item', async () => {
        const TEXTS = [`i have some things`, `i have something`, `this stuff is mine`, `that object is yours`,
          `is there anything you need?`, `everything is ready`, `do you want anything`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual([text, {}]);
        });
      });

      it('does not replace physical things that are very large', async () => {
        const TEXTS = [`this is the universe`, `the city is mine`, `a whole nation can't be wrong`, `the country is beautiful`,
          `the world is round`, `the mountain is high`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual([text, {}]);
        });
      });
    });
  });
  
});