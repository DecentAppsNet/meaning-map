// Putting these in separate module makes them mockable in tests.

/* v8 ignore start */
export function windowLocationPathname() {
  return window.location.pathname;
}

export function browserClientRect():DOMRect {
  return document.documentElement.getBoundingClientRect()
}
/* v8 ignore end */