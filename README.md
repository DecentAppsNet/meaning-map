# Meaning Map

This library allows you to create and execute matches against meaning maps.

A meaning map is a hierarchy of meaning nodes that progress from general to more specific. Each node contains matching criteria for an input text, and may also have child nodes each representing a more specific refinement of meaning.

The input text is first matched to a top-level meaning, and then progressively to child nodes until there are no more nodes in the path to evaluate. Certainty thresholds can be used to avoid over-matching.

Named entities and other parameter-intended text can be extracted from the input text and removed from the input text to make matching more accurate.

# Usage

```
import { importMeaningMap } from 'meaning-map';

const meaningMap = await importMeaningMap('https://decentapps.net/meaning-map/examples/inventory-mmap.md'); // This file isn't hosted yet. TODO
const match = await matchMeaning('i am adding a hammer and nails');
if (match.meaningId === meaningMap.ids.add_ITEMS) {
  console.log(match.paramValues.ITEMS); // "a hammer and nails"
}
```

You can also load a meaning map from a local filesystem if the library is running from a NodeJS process.

```
import { importMeaningMapFromFile } from 'meaning-map';

const meaningMap = await importMeaningMapfromFile('./maps/inventory-mmap.md');
```
