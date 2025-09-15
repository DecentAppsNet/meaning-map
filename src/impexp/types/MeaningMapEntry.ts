type MeaningMapEntry = {
  followingWords:string[],
  meaningId:string
}

export function duplicateMeaningMapEntry(entry:MeaningMapEntry):MeaningMapEntry {
  return { followingWords:[...entry.followingWords], meaningId:entry.meaningId };
}

export default MeaningMapEntry;