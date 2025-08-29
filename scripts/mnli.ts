import { initCli } from './helpers/initializeUtil.ts';
import { classify } from '../src/classification/transformersClassify';

const ASCII_GREEN = '\u001b[32m';
const ASCII_RED = '\u001b[31m';
const ASCII_RESET = '\u001b[0m';

async function _findBestHypothesis(premise:string, hypotheses:string[]):Promise<string> {
  let result:any = null;
  try {
    result = await classify(premise, hypotheses);
    let bestHypothesis = '', bestScore = -1;
    for(let i = 0; i < result.scores.length; ++i) {
      if (result.scores[i] > bestScore) {
        bestScore = result.scores[i];
        bestHypothesis = result.labels[i];
      }
    }
    const passFail = bestHypothesis === hypotheses[0] ? `${ASCII_GREEN}pass` : `${ASCII_RED}FAIL`;
    return `${passFail}: ${bestHypothesis} (${_toPercentString(bestScore)})${ASCII_RESET}`;
  } catch (err) {
    if (result) { console.error('failed to parse classify result: ' + JSON.stringify(result)); }
    console.error('Error in _findBestHypothesis:', err);
    throw err;
  }
}

function _toPercentString(fraction:number):string {
  return Math.floor(fraction * 100) + '%';
}

async function _isPhysicalObject(noun:string):Promise<boolean> {
  console.log(`--- is ${noun} a physical object? ---`);
  
  let failed = false;
  const premise = `The ${noun} is here.`;
  let result = await _findBestHypothesis(premise, ['physical object','abstract']);
  console.log(result);
  if (result.startsWith('FAIL')) failed = true;
  result = await _findBestHypothesis(premise, ['specific','vague']);
  console.log(result);
  if (result.startsWith('FAIL')) failed = true;
  result = await _findBestHypothesis(premise, ['inanimate','living']);
  console.log(result);
  if (result.startsWith('FAIL')) failed = true;
  result = await _findBestHypothesis(premise, ['small','vast']);
  console.log(result);
  if (result.startsWith('FAIL')) failed = true;
  result = await _findBestHypothesis(`I can put the ${noun} in a cardboard box.`, ['true','false']);
  console.log(result);
  if (result.startsWith('FAIL')) failed = true;
  return failed;
}

async function main() {
  await initCli();
  try {
    await _isPhysicalObject('guitar');
    await _isPhysicalObject('universe');
    await _isPhysicalObject('cat');
    await _isPhysicalObject('something');
    await _isPhysicalObject('city');
  } catch (err) {
    console.error('Error running classify:', err);
  }
}

main();