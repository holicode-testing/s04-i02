# Git Context: AI-Powered Learning Companion Platform

## Overview:
This document tracks the current Git state of the project, including branch information, recent commits, and Git configuration. It also outlines conventions for semantic commits and branch naming.

## Current Git Status:
- **Current Branch**: `main` (default for initial setup)
- **Last Commit Hash**: (To be filled by Git operations)
- **Last Commit Message**: (To be filled by Git operations)
- **Remote Repository URL**: (To be filled when remote is added, e.g., `https://github.com/holicode-testing/s04-i02`)
- **Git User Name**: `HoliCode Agent` (default)
- **Git User Email**: `agent@holicode.local` (default)

## Git Configuration:
### User Identity (Default):
```
git config user.name "HoliCode Agent"
git config user.email "agent@holicode.local"
```
(These can be overridden by user-specific Git configurations or environment variables.)

### Semantic Commit Conventions:
- **Format**: `type(scope): subject`
- **Types**:
    - `feat`: A new feature
    - `fix`: A bug fix
    - `docs`: Documentation only changes
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc)
    - `refactor`: A code change that neither fixes a bug nor adds a feature
    - `perf`: A code change that improves performance
    - `test`: Adding missing tests or correcting existing tests
    - `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
    - `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
    - `chore`: Other changes that don't modify src or test files
    - `revert`: Reverts a previous commit
- **Scope**: Optional, but recommended. Can be anything specifying the place of the commit change (e.g., `auth`, `frontend`, `backend`, `docs`, `ci`).
- **Subject**: Concise description of the change, less than 50 characters, starts with a lowercase letter, no period at the end.
- **Body**: Optional, provides a longer description of the change.
- **Footer**: Optional, for breaking changes or referencing issues (e.g., `BREAKING CHANGE:`, `Closes #123`).

### Branch Naming Conventions:
- `main`: Production-ready code.
- `develop`: Integration branch for new features.
- `feat/<feature-name>`: For new features.
- `fix/<issue-description>`: For bug fixes.
- `docs/<doc-topic>`: For documentation updates.
- `chore/<task-description>`: For maintenance tasks.
