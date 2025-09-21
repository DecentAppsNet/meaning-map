import { describe, it, expect } from 'vitest';

import { meaningMapToText } from '../meaningMapExporter';
import MeaningMap from '../types/MeaningMap';
import { parseMeaningMap } from '../meaningMapImporter';

describe('meaningMapExporter', () => {
  describe('meaningMapToText()', () => {
    function _reparse(meaningMap:MeaningMap):MeaningMap {
      const text = meaningMapToText(meaningMap);
      return parseMeaningMap(text);
    }

    it('reparses an empty map', () => {
      const map:MeaningMap = {};
      expect(_reparse(map)).toEqual(map);
    });

    it('reparses a single rule for a single first word', () => {
      const map:MeaningMap = {
        add: [ { followingWords: ['ITEMS'], meaningId: '1.1' } ]
      };
      expect(_reparse(map)).toEqual(map);
    });

    it('reparses multiple rules under a single first word including empty following words', () => {
      const map:MeaningMap = {
        add: [
          { followingWords: [], meaningId: '1' },
          { followingWords: ['ITEMS'], meaningId: '1.1' },
          { followingWords: ['to', 'NUMBER'], meaningId: '1.2' }
        ]
      };
      expect(_reparse(map)).toEqual(map);
    });

    it('reparses multiple first words', () => {
      const map:MeaningMap = {
        add: [ { followingWords: [], meaningId: '1' } ],
        where: [
          { followingWords: ['is', 'ITEMS'], meaningId: '2.1' },
          { followingWords: ['are', 'ITEMS'], meaningId: '2.1' }
        ]
      };
      expect(_reparse(map)).toEqual(map);
    });
  });
});