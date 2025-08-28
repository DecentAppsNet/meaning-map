import { describe, it, beforeAll, expect } from 'vitest';

import { replaceItems } from "../replaceItems";
import { initTransformersEmbedder } from '@/embeddings/transformersEmbedder';

describe('replaceItems', () => {
  beforeAll(async () => {
    await initTransformersEmbedder();
  });

  describe('replaceItems()', () => {
    it('replaces nothing for empty text', async () => {
      expect(await replaceItems(``)).toEqual(``);
    });

    it('replaces nothing for sentence with no nouns', async () => {
      expect(await replaceItems(`hi`)).toEqual(`hi`);
    });

    it('replaces a single noun with ITEMS', async () => {
      expect(await replaceItems(`screwdriver`)).toEqual(`ITEMS`);
    });

    describe('when parsing sentences with single nouns', () => {
      it('replaces a single noun at end of a sentence with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single noun at beginning of a sentence with ITEMS', async () => {
        expect(await replaceItems(`screwdrivers i definitely have`)).toEqual(`ITEMS i definitely have`);
      });

      it('replaces a single noun in middle of a sentence with ITEMS', async () => {
        expect(await replaceItems(`i have a screwdriver and you are impressed`)).toEqual(`i have ITEMS and you are impressed`);
      });
      
      it('replaces a compound noun with ITEMS', async () => {
        expect(await replaceItems(`i have a power screwdriver`)).toEqual(`i have ITEMS`);
      });
    });
  
    describe('when parsing sentences with different kinds of physical items', () => {
      it('replaces a single clothing noun with ITEMS', async () => {
        expect(await replaceItems(`i have a sweater`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single food noun with ITEMS', async () => {
        expect(await replaceItems(`i have a sandwich`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single furniture noun with ITEMS', async () => {
        expect(await replaceItems(`i have a chair`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single appliance noun with ITEMS', async () => {
        expect(await replaceItems(`i have a toaster`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single utensil noun with ITEMS', async () => {
        expect(await replaceItems(`i have a fork`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single tool noun with ITEMS', async () => {
        expect(await replaceItems(`i have a hammer`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single device noun with ITEMS', async () => {
        expect(await replaceItems(`i have a phone`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single instrument noun with ITEMS', async () => {
        expect(await replaceItems(`i have a guitar`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single product noun with ITEMS', async () => {
        expect(await replaceItems(`i have a bottle of shampoo`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single package noun with ITEMS', async () => {
        expect(await replaceItems(`i have a box`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single equipment noun with ITEMS', async () => {
        expect(await replaceItems(`i have a tent`)).toEqual(`i have ITEMS`);
      });

      it('replaces a single gear noun with ITEMS', async () => {
        expect(await replaceItems(`i have hiking boots`)).toEqual(`i have ITEMS`);
      });
    });

    describe('when parsing sentences with multiple different physical items', () => {
      it('replaces two different nouns with ITEMS and ITEMS2', async () => {
        expect(await replaceItems(`i have a screwdriver and a sweater`)).toEqual(`i have ITEMS and ITEMS2`);
      });
    });

    describe('when parsing sentences with nouns that are not specific physical items', () => {
      it('does not replace a single abstract noun', async () => {
        const TEXTS = [`i have an idea`, `i have a thought`, `i have a plan`, `i have a suggestion`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual(text);
        });
      });

      it('does not replace an unspecific description of an item', async () => {
        const TEXTS = [`i have some things`, `i have something`, `this stuff is mine`, `that object is yours`,
          `is there anything you need?`, `everything is ready`, `do you want anything`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual(text);
        });
      });

      it('does not replace physical things that are very large', async () => {
        const TEXTS = [`this is the universe`, `the city is mine`, `a whole nation can't be wrong`, `the country is beautiful`,
          `the world is round`, `the building is tall`, `the house is big`, `the mountain is high`];
        TEXTS.forEach(async (text) => {
          expect(await replaceItems(text)).toEqual(text);
        });
      });
    });
  });
  
});