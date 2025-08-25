import MeaningClassifications from "./types/MeaningClassifications";
import MeaningIndex, { UNCLASSIFIED_MEANING_ID } from "./types/MeaningIndex";
import { writeTextFile } from '../common/fileUtil';
import { assertNonNullable } from "@/common/assertUtil";

/*
### Meaning Classification

Inputs: Meaning Index file, Corpus file

Contains utterances from a corpus that have been classified by meaning according to the rules of the meaning index. An LLM is used to perform this classification. In addition to performing the classification, the LLM will also identify and replace sections of words with variables from the meaning description. These variables are designated in ALL CAPS within the description.

Lines that start with a number, e.g. "1", "1.1", "0", indicate the start of a meaning section. They will follow the same format as lines within the MeaningIndex. It is acceptable for the description to be omitted, but for readability, it's nice to include it.

Unnumbered lines within the section are utterances from the corpus that have been classified under a specified meaning.

If a meaning has no utterances classified to it, the meaning section should be omitted from the file.

"0. Unmapped" contains all corpus items that were not classified under one of the meanings from the Meaning Index. For readability reasons, this section is added to the end of the file. All other sections are ordered alphabetically, (e.g., "1.", "1.1", "2.") regardless of the order of meanings from the Meaning Index.

Example file:
```
why is everything so hard
1 Adding
let's add some stuff
1.1 Adding ITEMS
add a ITEMS
i'm putting ITEMS in
0 Unmapped
```
*/

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