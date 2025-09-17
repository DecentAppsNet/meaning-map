import MeaningClassifications from "@/impexp/types/MeaningClassifications";
import WordUsageMap from "./types/WordUsageMap";
import { assert } from '@/common/assertUtil';
import { isValidUtterance, utteranceToWords } from "./utteranceUtil";

export function generateWordUsageMap(classifications:MeaningClassifications):WordUsageMap {
  const wordUsageMap:WordUsageMap = {};
  const meaningIds:string[] = Object.keys(classifications);
  meaningIds.forEach(meaningId => {
    const utterances = classifications[meaningId];
    utterances.forEach(utterance => {
      assert(isValidUtterance(utterance));
      const words = utteranceToWords(utterance);
      words.forEach(word => {
        let entry = wordUsageMap[word];
        if (!entry) {
          entry = {usageCount:0, meaningIds:new Set([meaningId])};
          wordUsageMap[word] = entry;
        }
        entry.usageCount++;
        entry.meaningIds.add(meaningId);
      });
    });
  });
  return wordUsageMap;
}