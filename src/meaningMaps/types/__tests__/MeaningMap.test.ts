import { describe, it, expect } from 'vitest';
import exampleMeaningMapText from '@/meaningMaps/__tests__/data/exampleMeaningMap';
import { duplicateMeaningMap, freezeMeaningMap } from "../MeaningMap";
import { loadMeaningMap } from '@/impexp/meaningMapImporter';

describe('MeaningMapGroup', () => {
  describe('freezeMeaningMap()', () => {
    it('freezes meaning map', async () => {
      const meaningMap = await loadMeaningMap(exampleMeaningMapText); // Already frozen.
      const nextMeaningMap = duplicateMeaningMap(meaningMap);
      nextMeaningMap.ids['unfrozen_test'] = 4;
      freezeMeaningMap(nextMeaningMap);
      expect(() => { nextMeaningMap.root.id = 5; }).toThrow();
      expect(() => { nextMeaningMap.root.children = []; }).toThrow();
      expect(() => { nextMeaningMap.root.children[0].id = 6; }).toThrow();
      expect(() => { nextMeaningMap.root.children[0].matchVectorGroup = []; }).toThrow();
      expect(() => { nextMeaningMap.replacers.push({} as any); }).toThrow();
      expect(() => { nextMeaningMap.ids['unfrozen_test'] = 7; }).toThrow();
    });
  });
});