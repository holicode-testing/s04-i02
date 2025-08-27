## Description

This PR addresses TASK-002: Configure Code Quality Tools (ESLint, Prettier) in Monorepo.
It aims to establish consistent code style and quality enforcement across the Nx monorepo.

## Changes Made

- Created `prettier.config.mjs` at the root with standard formatting rules.
- Modified `eslint.config.mjs` to integrate Prettier, ensuring it runs as an ESLint rule and disables conflicting ESLint rules.
- Configured VSCode settings (`.vscode/settings.json`) to enable auto-formatting and ESLint auto-fix on save.
- Validated that linting and formatting work correctly for both `api` and `web` applications using `pnpm nx lint` and `pnpm nx format` commands.

## Related Issues

Closes #TASK-002

## Checklist

- [x] Code follows project's coding style guidelines.
- [x] All automated tests pass.
- [ ] Documentation has been updated (if applicable).
- [ ] Breaking changes have been clearly noted (if applicable).
