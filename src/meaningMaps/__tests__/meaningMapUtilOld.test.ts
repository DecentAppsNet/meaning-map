import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

import MeaningClassifications from '@/impexp/types/MeaningClassifications';
import { generateMeaningMapFromClassifications } from '../meaningMapUtilOld';
import { exampleClassifications, exampleMeaningMap } from './data/classificationsTestData';
import MeaningMap from '@/impexp/types/MeaningMapOld';
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

    const DISPLAY_DESCRIBE_LOG = false;
    it('generates meaning map from populated classifications', () => {
      const meaningMap:MeaningMap = generateMeaningMapFromClassifications(classifications);
      if (DISPLAY_DESCRIBE_LOG) console.log(flushLog());
      expect(meaningMap).toEqual(exampleMeaningMap);
    });
  });
});