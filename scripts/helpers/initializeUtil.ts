import { initialize, InitOption } from '../../src/initialization/initUtil.ts';

const start = Date.now();

export async function initCli(initOptions:number):Promise<void> {
  console.log('Initialization starting (first run may download model files)...');

  try {
    await initialize(initOptions);
    const secs = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Initialization completed in ${secs}s.`);
  } catch (err) {
    console.error('Initialization failed:');
    console.error(err);
    process.exitCode = 1;
  }
}