import { initialize } from '../../src/initialization/initUtil.ts';

const start = Date.now();

export async function initCli():Promise<void> {

  console.log('[meaning-map] Initialization starting (first run may download model files)...');

  try {
    await initialize();
    const secs = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[meaning-map] Initialization completed in ${secs}s.`);
  } catch (err) {
    console.error('[meaning-map] Initialization failed:');
    console.error(err);
    process.exitCode = 1;
  }
}