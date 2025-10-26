/* v8 ignore start */

export { initialize, InitOption } from './initialization/initUtil';
export { importMeaningMap, importMeaningMapFromFile, loadMeaningMap } from './impexp/meaningMapImporter';
export { meaningMapToText } from './impexp/meaningMapExporter';
export { matchMeaning, matchMeaningWithStats } from './meaningMaps/meaningMapUtil';
export { registerReplacer, unregisterReplacer, isReplacerRegistered, makeUtteranceReplacements } from './replacement/replaceUtil';
export { isPlainUtterance, isValidUtterance, normalizeUtterance } from './sentenceParsing/utteranceUtil';

export type { default as MeaningMap } from './meaningMaps/types/MeaningMap';
export type { default as MeaningMapNode } from './meaningMaps/types/MeaningMapNode';
export type { default as MeaningMatch } from './meaningMaps/types/MeaningMatch';
export type { default as MeaningMatchStats } from './meaningMaps/types/MeaningMatchStats';
export type { default as MeaningMatchNodeStats } from './meaningMaps/types/MeaningMatchNodeStats';

/* v8 ignore end */