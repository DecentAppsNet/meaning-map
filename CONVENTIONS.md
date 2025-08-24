# Project Conventions

For developers, maintainers, and AIs contributing to the project.

## Coding Conventions

- Private helpers and functions that are not exported should begin with a single leading underscore (for example `_fetchJsonWithAuth`).
- In a module, functions should be defined before the functions that call them. If function A is called by function B, A's definition should precede B's.
- Comments should be used sparingly. Prefer to write self-documenting code. Use comments to explain why code exists, to document function contracts, or to note non-obvious behaviors that cannot be easily inferred from the code itself.
- Prefer self-documenting function and variable names, even at the expense of brevity. Clear names reduce the need for comments.
- Spacing convention for type annotations vs value assignments:
	- Type annotations should not have a space after the colon (example: `body:unknown`).
	- Ordinary value assignments or object member values should have a space after the colon for readability (example: `x: 3`).
- Regular expressions should be encapsulated in function calls that describe completely what they do, e.g. `isAlphaNumericAsciiChar(c)`. If the name of the function would need to be much larger than 30 characters or so to describe the functionality, the RegEx is too complex, and should be broken up or omitted by using using non-regex parsing code.

These conventions are intentionally small and pragmatic; follow existing style where it already exists and apply these rules to new code.

## Unit Testing Conventions

- Test contracts, not implemementation details.
- Favor the least amount of mocking necessary.
- Put filesystem / networking / O/S API calls in separate modules that are easily mockable.
- Test one thing per test.
- Test exported APIs of modules, not helper functions. Helper functions might initially be tested directly, but as a module matures, the tests should move to exported APIs to cover the same functionality.
- Use liberal, guilt-free coverage exclusion for low-test-value code, BUT...
- Arrive at 100% test coverage after these exclusions are made.