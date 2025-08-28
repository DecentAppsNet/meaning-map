import MeaningClassifications from "./types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "./types/MeaningIndex";
import { writeTextFile } from '../common/fileUtil';
import { assertNonNullable } from "@/common/assertUtil";

function _getMeaningIdsInExportOrder(classifications:MeaningClassifications):string[] {
  // Include only meaning IDs that have at least one utterance.
  const ids = Object.keys(classifications).filter(id => Array.isArray(classifications[id]) && classifications[id].length > 0);
  // Separate the special '0' unmapped bucket so we can put it at the end.
  const unmappedIndex = ids.indexOf(UNCLASSIFIED_MEANING_ID);
  const hasUnmapped = unmappedIndex !== -1;
  const nonUnmapped = ids.filter(id => id !== UNCLASSIFIED_MEANING_ID);
  // Sort remaining ids alphabetically (string order as specified).
  nonUnmapped.sort((a,b) => a.localeCompare(b));
  if (hasUnmapped) nonUnmapped.push('0');
  return nonUnmapped;
}

function _getMeaningSectionHeader(meaningId:string, meaningIndex?:MeaningIndex):string {
  if (!meaningIndex) return `${meaningId}\n`;
  if (meaningId === UNCLASSIFIED_MEANING_ID) return `${meaningId} unclassified\n`;
  const meaning = meaningIndex[meaningId];
  return meaning ? `${meaningId} ${meaning.description}\n` : `${meaningId}\n`;
}

export function formatMeaningClassificationsForExport(classifications:MeaningClassifications, meaningIndex?:MeaningIndex):string {
  const meaningIds = _getMeaningIdsInExportOrder(classifications);
  if (!meaningIds.length) return '';

  let concat = '';
  meaningIds.forEach((meaningId, idx) => {
    concat += _getMeaningSectionHeader(meaningId, meaningIndex);
    const utterances = classifications[meaningId];
    assertNonNullable(utterances); // Or it's a debug error in _getMeaningIdsInExportOrder() probably. 
    utterances.forEach(utterance => { concat += `${utterance}\n`; });
    // Separate sections with a trailing newline (but avoid extra newline at very end)
    if (idx < meaningIds.length - 1) concat += '\n';
  });
  return concat;
}

/* v8 ignore start */
export async function exportMeaningClassifications(classifications:MeaningClassifications, filepath:string, meaningIndex?:MeaningIndex) {
  const text = formatMeaningClassificationsForExport(classifications, meaningIndex);
  await writeTextFile(filepath, text);
}
/* v8 ignore end */