let theModule = null;

const start = Date.now();

export async function initCli() {
  if (theModule) return theModule;

  console.log('[meaning-map] Initialization starting...');
  console.log('[meaning-map] Loading embedding model (first run may download model files)...');

  let initialize;
  try {
    // Import from the built ESM bundle, which re-exports initialize.
    theModule = await import('../../dist/meaning-map.js');
    initialize = theModule.initialize;
  } catch (err) {
    theModule = null;
    console.error('[meaning-map] Failed to load build output from dist/meaning-map.js');
    console.error('Hint: Run `npm run build` and try again.');
    console.error(err);
    process.exitCode = 1;
    return;
  }

  if (typeof initialize !== 'function') {
    theModule = null;
    console.error('[meaning-map] initialize() not found in the built bundle.');
    process.exitCode = 1;
    return;
  }

  try {
    await initialize();
    const secs = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[meaning-map] Initialization completed in ${secs}s.`);
  } catch (err) {
    theModule = null;
    console.error('[meaning-map] Initialization failed:');
    console.error(err);
    process.exitCode = 1;
  }

  return theModule;
}