import { describe, expect, it } from 'vitest';
import { parseMeaningMap } from '../meaningMapImporter';

describe('meaningMapImporter', () => {
  describe('parseMeaningMap()', () => {
    it('returns empty meaning map for empty object', () => {
      const out = parseMeaningMap('{}');
      expect(out).toEqual({});
    });

    it('parses a single rule for a single first word', () => {
      const json = '{"add": ["ITEMS:1.1"]}';
      const expected = {
        add: [
          { followingWords: ['ITEMS'], meaningId: '1.1' }
        ]
      };
      const out = parseMeaningMap(json);
      expect(out).toEqual(expected);
    });

    it('parses multiple rules under a single first word including empty following words', () => {
      const json = '{"add": [":1", "ITEMS:1.1", "to NUMBER:1.2"]}';
      const expected = {
        add: [
          { followingWords: [], meaningId: '1' },
          { followingWords: ['ITEMS'], meaningId: '1.1' },
          { followingWords: ['to', 'NUMBER'], meaningId: '1.2' }
        ]
      };
      const out = parseMeaningMap(json);
      expect(out).toEqual(expected);
    });

    it('parses multiple first words', () => {
      const json = '{"add": [":1"], "where": ["is ITEMS:2.1", "are ITEMS:2.1"]}';
      const expected = {
        add: [
          { followingWords: [], meaningId: '1' }
        ],
        where: [
          { followingWords: ['is', 'ITEMS'], meaningId: '2.1' },
          { followingWords: ['are', 'ITEMS'], meaningId: '2.1' }
        ]
      };
      const out = parseMeaningMap(json);
      expect(out).toEqual(expected);
    });

    it('throws when input is not a JSON object', () => {
      expect(() => parseMeaningMap('null')).toThrow(/JSON object/);
    });

    it('throws when a meaning map value is not an array', () => {
      const json = '{"add": "not-an-array"}';
      expect(() => parseMeaningMap(json)).toThrow(/must be an array/);
    });

    it('throws when a rule is not a string', () => {
      const json = '{"add": [123]}';
      expect(() => parseMeaningMap(json)).toThrow(/must be a string/);
    });

    it('throws when a rule is missing a colon separator', () => {
      const json = '{"add": ["ITEMS1.1"]}';
      expect(() => parseMeaningMap(json)).toThrow(/missing ':'/);
    });

    it('throws when a rule has an empty meaningId', () => {
      const json = '{"add": ["ITEMS:"]}';
      expect(() => parseMeaningMap(json)).toThrow(/empty meaningId/);
    });

    it('throws when trump IDs are malformed', () => {
      const json = '{"add": ["ITEMS:1!-zz"]}';
      expect(() => parseMeaningMap(json)).toThrow(/Malformed trump IDs/);
    });

    it('throw if missing trump IDs after !', () => {
      const json = '{"add": ["ITEMS:1!"]}';
      expect(() => parseMeaningMap(json)).toThrow(/Malformed trump IDs/);
    });
  });
});