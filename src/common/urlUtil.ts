import { windowLocationPathname } from "./windowUtil";
import { assert } from './assertUtil';

let theBasePath:string|null = null;

/*  Some assumptions:
    * First path segment is always the app name
    * If the app name is prefixed with an underscore (staged app), the base will include a version hash in the second path segment.
    * Generally, any valid-but-weird URLs will just give garbage results, and that can be a debug error. */
export function parseBasePathFromUriPath(path:string) {
  const pathSegments = path.split('/').filter(segment => segment !== '');
  if (pathSegments.length < 1) return '/';

  const appName = pathSegments[0];
  const isStagedApp = appName.startsWith('_') && pathSegments.length > 1;
  return isStagedApp ? `/${appName}/${pathSegments[1]}/` : `/${appName}/`;
}

// The base path will be in a format like '/' (dev server), '/app/' (production), or '/_app/0a0a0a0/" (staging).
function _getBasePath() {
  if (!theBasePath) { theBasePath = parseBasePathFromUriPath(windowLocationPathname()); }
  return theBasePath;
}

export function resetBasePath() {
  theBasePath = parseBasePathFromUriPath(windowLocationPathname());
}

// Prepends the base path to a path to make relative URLs that work from dev server, production, or staging.
export function baseUrl(path:string = '') {
  assert(!path.startsWith('http'), `only pass path to baseUrl() not a URL`);
  if (path.startsWith('/')) { path = path.slice(1); }
  const basePath = _getBasePath();
  return `${basePath}${path}`;
}