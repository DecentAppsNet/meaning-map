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

These conventions are intentionally small and pragmatic; follow existing style where it already exists and apply these rules to new code.