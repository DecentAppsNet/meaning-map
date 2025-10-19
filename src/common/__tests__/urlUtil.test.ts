import { describe, expect, it, vi } from "vitest";

// Mocking first.
vi.mock('../windowUtil', async () => ({
  ...(await vi.importActual('../windowUtil')),
  windowLocationPathname: vi.fn(() => {
    return theWindowLocationPathname;
  }),
}));

// Imports after mocking.
import { parseBasePathFromUriPath, baseUrl, resetBasePath } from "../urlUtil";

let theWindowLocationPathname = '';

describe('urlUtil', () => {
  describe('parseBasePathFromUriPath()', () => {
    it('parses empty path', () => {
      expect(parseBasePathFromUriPath('')).toEqual('/');
    });

    it('parses single /', () => {
      expect(parseBasePathFromUriPath('/')).toEqual('/');
    });

    it('parses app name without /', () => {
      expect(parseBasePathFromUriPath('/app')).toEqual('/app/');
    });

    it('parses app name with /', () => {
      expect(parseBasePathFromUriPath('/app/')).toEqual('/app/');
    });

    it('parses longer path without trailing /', () => {
      expect(parseBasePathFromUriPath('/app/detail')).toEqual('/app/');
    });

    it('parses longer path with trailing /', () => {
      expect(parseBasePathFromUriPath('/app/detail/')).toEqual('/app/');
    });

    it('parses path with appname ending in filename', () => {
      expect(parseBasePathFromUriPath('/app/index.html')).toEqual('/app/');
    });

    it('parses staging path without trailing /', () => {
      expect(parseBasePathFromUriPath('/_app/000000')).toEqual('/_app/000000/');
    });

    it('parses staging path with trailing /', () => {
      expect(parseBasePathFromUriPath('/_app/000000/')).toEqual('/_app/000000/');
    });

    it('parses longer staging path without trailing /', () => {
      expect(parseBasePathFromUriPath('/_app/000000/detail')).toEqual('/_app/000000/');
    });

    it('parses longer staging path with trailing /', () => {
      expect(parseBasePathFromUriPath('/_app/000000/detail/')).toEqual('/_app/000000/');
    });

    it('parses longer staging path ending in filename', () => {
      expect(parseBasePathFromUriPath('/_app/000000/detail/index.html')).toEqual('/_app/000000/');
    });
  });

  describe('baseUrl()', () => {
    it('returns app-manifest.json URL for production-deployed app', () => {
      theWindowLocationPathname = '/aissh/';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/aissh/app-manifest.json');
    });

    it('returns app-manifest.json URL for stage-deployed app', () => {
      theWindowLocationPathname = '/_aissh/c7034bd/';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/_aissh/c7034bd/app-manifest.json');
    });

    it('returns app-manifest.json URL for dev-deployed app', () => {
      theWindowLocationPathname = '/';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/app-manifest.json');
    });

    it('returns URL constrained to base path when window location has longer path', () => {
      theWindowLocationPathname = '/aissh/some/dumb/path';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/aissh/app-manifest.json');
    });

    it('returns URL constrained to base path when window location has trailing slash', () => {
      theWindowLocationPathname = '/aissh/some/dumb/path/';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/aissh/app-manifest.json');
    });

    it('returns URL constrained to base path when window location has filename', () => {
      theWindowLocationPathname = '/aissh/index.html';
      resetBasePath();
      expect(baseUrl('app-manifest.json')).toEqual('/aissh/app-manifest.json');
    });

    it('returns base URL if no path passed', () => {
      theWindowLocationPathname = '/aissh/index.html';
      resetBasePath();
      expect(baseUrl()).toEqual('/aissh/');
    });
  });
});