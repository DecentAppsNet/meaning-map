/* v8 ignore start */

/* These assertion helpers are intentionally pure (throw on failure) so that
  modern bundlers/minifiers can tree-shake them away when they are unused by
  a consumer's bundle. */

export function assertNonNullable<T>(x:T, message:string = 'Value is unexpectedly undefined/null.'): 
    asserts x is NonNullable<T> {
  if (x === undefined || x === null) throw new Error(message);
}

export function assertTruthy<T>(condition:T, message:string = 'Condition is unexpectedly falsy.'):
    asserts condition is Exclude<T, 0 | false | '' | null | undefined>{
  if (!condition) throw new Error(message);
}

export function assert(condition:boolean, message:string = 'Assertion failed.'):
    asserts condition {
  if (!condition) throw new Error(message);
}

export function botch(message:string = 'Botched!'):never {
  throw new Error(message);
}

/* v8 ignore end */