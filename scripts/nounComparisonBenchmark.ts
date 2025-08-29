#!/usr/bin/env node

import { initCli } from './helpers/initializeUtil.ts';

// Format is [noun, [similar nouns], [dissimilar nouns]]
const NOUNS_TO_COMPARE = [
  ['tool', ['hammer', 'screwdriver', 'wrench', 'pliers', 'drill'], ['spoon', 'shirt', 'car', 'tree', 'house']],
  ['device', ['phone', 'laptop', 'tablet', 'camera', 'clock'], ['fork', 'pants', 'bicycle', 'flower', 'building']],
  ['vehicle', ['car', 'truck', 'bike', 'bus', 'train'], ['knife', 'jacket', 'trampoline', 'tree', 'bridge']],
  ['fruit', ['apple', 'banana', 'orange', 'grape', 'pear'], ['casket', 'basket', 'cake', 'dog', 'grocer']],
  ['instrument', ['guitar', 'piano', 'drums', 'violin', 'flute'], ['brush', 'scarf', 'camera', 'tree', 'building']],
  ['utensil', ['fork', 'spoon', 'knife', 'chopsticks', 'ladle'], ['hammer', 'shirt', 'car', 'tree', 'house']],
  ['appliance', ['fridge', 'oven', 'microwave', 'toaster', 'blender'], ['bicycle', 'pants', 'car', 'tree', 'building']],
  ['clothing', ['shirt', 'pants', 'jacket', 'dress', 'shoes'], ['hammer', 'spoon', 'car', 'tree', 'house']],
  ['machine', ['computer', 'printer', 'scanner', 'router', 'modem'], ['fork', 'jacket', 'bicycle', 'tree', 'bridge']],
  ['furniture', ['table', 'chair', 'sofa', 'bed', 'desk'], ['knife', 'scarf', 'car', 'tree', 'building']],
  ['accessory', ['watch', 'belt', 'hat', 'scarf', 'gloves'], ['brush', 'pants', 'car', 'tree', 'house']],
  ['product', ['gadget', 'item', 'thing', 'object', 'device'], ['vegetable', 'clothing', 'vehicle', 'tree', 'building']],
  ['package', ['box', 'bag', 'container', 'parcel', 'crate'], ['fruit', 'furniture', 'instrument', 'tree', 'house']],
  ['container', ['bottle', 'jar', 'can', 'cup', 'box'], ['tool', 'clothing', 'vehicle', 'tree', 'building']],
  ['equipment', ['gear', 'apparatus', 'instrument', 'device', 'tool'], ['food', 'clothing', 'vehicle', 'tree', 'house']],
  ['gear', ['backpack', 'tent', 'boots', 'jacket', 'gloves'], ['furniture', 'instrument', 'vehicle', 'tree', 'building']],
  ['food', ['apple', 'bread', 'cheese', 'meat', 'vegetable'], ['tool', 'clothing', 'vehicle', 'tree', 'house']],
  ['camping item', ['tent', 'sleeping bag', 'backpack', 'stove', 'lantern'], ['furniture', 'instrument', 'vehicle', 'tree', 'building']],
  ['office item', ['pen', 'paper', 'stapler', 'notebook', 'envelope'], ['fruit', 'clothing', 'vehicle', 'tree', 'house']],  
  ['cleaning item', ['detergent', 'broom', 'mop', 'sponge', 'brush'], ['tool', 'clothing', 'vehicle', 'tree', 'building']],
  ['kitchen tool or item', ['pan', 'pot', 'knife', 'cutting board', 'spatula'], ['furniture', 'instrument', 'vehicle', 'tree', 'house']],
  ['toiletry', ['toothbrush', 'soap', 'shampoo', 'towel', 'razor'], ['tool', 'clothing', 'vehicle', 'tree', 'building']]
];

const LOW_MATCH_THRESHOLD = 0.4;
const HIGH_MATCH_THRESHOLD = 0.5;

const ASCII_RED = '\u001b[31m';
const ASCII_GREEN = '\u001b[32m';
const ASCII_RESET = '\u001b[0m';

async function getNounComparisonDescription(m, noun1, noun2) {
  const { compareNouns } = m;
  const score = await compareNouns(noun1, noun2);
  let asciiColorPrefix = '';
  if (score < LOW_MATCH_THRESHOLD) {
    asciiColorPrefix = ASCII_RED;
  } else if (score > HIGH_MATCH_THRESHOLD) {
    asciiColorPrefix = ASCII_GREEN;
  }
  return `    ${asciiColorPrefix}${noun2}: ${score.toFixed(4)}${ASCII_RESET}\n`;
}

async function getComparisonSummary(m, noun, similarNouns, dissimilarNouns) {
  const { compareNouns } = m;
  let summary = `Comparing "${noun}"\n`;
  summary += '  to similar nouns:\n';
  for(let i = 0; i < similarNouns.length; i++) {
    summary += await getNounComparisonDescription(m, noun, similarNouns[i]);
  }
  summary += '  to dissimilar nouns:\n';
  for(let i = 0; i < dissimilarNouns.length; i++) {
    summary += await getNounComparisonDescription(m, noun, dissimilarNouns[i]);
  }
  return summary;
}

async function main() {
  const m = await initCli();

  for(let i = 0; i < NOUNS_TO_COMPARE.length; i++) {
    const [noun, similarNouns, dissimilarNouns] = NOUNS_TO_COMPARE[i];
    const summary = await getComparisonSummary(m, noun, similarNouns, dissimilarNouns);
    console.log(summary);
  }
}

main();
