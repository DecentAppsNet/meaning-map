/* v8 ignore start */
export function getRuntime():'node'|'browser' {
  // `process` is defined in Node, but not in browsers (unless a bundler polyfills it)
  if (typeof process !== 'undefined' && process?.versions?.node) {
    return 'node';
  }
  // In a browser `window` and `document` exist
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  }
  // Fallback – treat unknown as browser (the safest default for the library)
  return 'browser';
}
/* v8 ignore end */