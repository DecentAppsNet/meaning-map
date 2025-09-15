type MeaningClassifications = {
  [meaningId:string]:string[]
}

export function duplicateMeaningClassifications(mc:MeaningClassifications):MeaningClassifications {
  const result:MeaningClassifications = {};
  for(const meaningId in mc) {
    result[meaningId] = [...mc[meaningId]];
  }
  return result;
}

export default MeaningClassifications;