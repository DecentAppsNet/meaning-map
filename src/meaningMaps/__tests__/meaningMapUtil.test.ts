import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import MeaningClassifications from '@/impexp/types/MeaningClassifications';
import { generateMeaningMapFromClassifications } from '../meaningMapUtil';
import { exampleClassifications, exampleMeaningMap } from './data/classificationsTestData';
import MeaningMap from '@/impexp/types/MeaningMap';
import { flushLog } from '@/common/describeLog';

describe('meaningMapUtil', () => {
  describe('generateMeaningMapFromClassifications()', () => {
    let classifications:MeaningClassifications;

    beforeAll(() => {
      classifications = JSON.parse(JSON.stringify(exampleClassifications));
    });

    beforeEach(() => {
      expect(classifications).toEqual(exampleClassifications);
    });

    it('generates meaning map from populated classifications', () => {
      const meaningMap:MeaningMap = generateMeaningMapFromClassifications(classifications);
      // console.log(JSON.stringify(meaningMap,undefined,2));
      console.log(flushLog());
      expect(meaningMap).toEqual(exampleMeaningMap);
    });
  });
});