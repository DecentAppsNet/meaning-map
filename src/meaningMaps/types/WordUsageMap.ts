type WordUsageMapEntry = { 
  usageCount:number, 
  meaningIds:Set<string>
}

type WordUsageMap = {
  [word:string]:WordUsageMapEntry
}

export function duplicateWordUsageMap(from:WordUsageMap):WordUsageMap {
  const to:WordUsageMap = {};
  Object.keys(from).forEach(word => {
    const fromEntry = from[word];
    to[word] = {usageCount:fromEntry.usageCount, meaningIds:new Set(fromEntry.meaningIds)};
  });
  return to;
}

export default WordUsageMap;