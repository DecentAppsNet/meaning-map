type MeaningMapEntry = {
  followingWords:string[],
  meaningId:string
}

export function duplicateMeaningMapEntry(entry:MeaningMapEntry):MeaningMapEntry {
  return { followingWords:[...entry.followingWords], meaningId:entry.meaningId };
}

export function areMeaningMapEntriesEqual(a:MeaningMapEntry, b:MeaningMapEntry):boolean {
  if (a.meaningId !== b.meaningId) return false;
  if (a.followingWords.length !== b.followingWords.length) return false;
  for(let i = 0; i < a.followingWords.length; ++i) {
    if (a.followingWords[i] !== b.followingWords[i]) return false;
  }
  return true;
}

export default MeaningMapEntry;