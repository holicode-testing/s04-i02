# ESLint & Prettier Setup for TypeScript + Nx

## Problem Statement
ESLint configuration challenges in TypeScript/Nx monorepos:
- Flat Config vs Legacy config confusion
- VSCode auto-fix not working
- Prettier integration conflicts
- Monorepo-wide vs project-specific rules
- Parser and module resolution errors

## Solution Pattern

### 1. Root-Level Flat Config
```javascript
// eslint.config.mjs (root)
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['**/dist', '**/node_modules', '**/.nx'] },
  { files: ['**/*.{js,mjs,cjs,ts,tsx}'] },
  { 
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettier, // Must be last to override formatting rules
];
```

### 2. Project-Level Config
```javascript
// apps/api/eslint.config.mjs
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Project-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
];
```

### 3. VSCode Settings for Auto-Fix
```json
// .vscode/settings.json
{
  "eslint.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 4. Prettier Configuration
```json
// .prettierrc.json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5. Package.json Scripts
```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint:check": "eslint .",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\""
  }
}
```

### 6. Nx Target Defaults
```json
// nx.json
{
  "targetDefaults": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["{projectRoot}/**/*.{ts,tsx,js,jsx}"]
      },
      "outputs": ["{options.outputFile}"]
    }
  }
}
```

## Common Issues & Solutions

### Issue 1: "Cannot find module 'eslint-config-prettier'"
**Fix**: Install as dev dependency
```bash
npm install -D eslint-config-prettier
```

### Issue 2: Auto-fix not working in VSCode
**Fix**: Ensure ESLint extension is using Flat Config
1. Check ESLint output panel for errors
2. Verify `"eslint.useFlatConfig": true` in settings
3. Restart ESLint server: Cmd+Shift+P → "ESLint: Restart ESLint Server"

### Issue 3: "Parsing error: Cannot read file"
**Fix**: Set project references correctly
```javascript
// eslint.config.mjs
export default [
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
```

### Issue 4: Prettier conflicts with ESLint
**Fix**: Ensure prettier config is last
```javascript
export default [
  ...tseslint.configs.recommended,
  prettier, // Must be last!
];
```

### Issue 5: Rules not applying to certain files
**Fix**: Check file glob patterns
```javascript
{
  files: ['**/*.ts', '**/*.tsx'], // Ensure patterns match your files
  rules: { /* ... */ }
}
```

## Migration from Legacy Config

### Step 1: Backup existing config
```bash
mv .eslintrc.json .eslintrc.json.backup
```

### Step 2: Install Flat Config dependencies
```bash
npm install -D \
  @eslint/js \
  typescript-eslint \
  globals \
  eslint-config-prettier
```

### Step 3: Create new Flat Config
```bash
touch eslint.config.mjs
```

### Step 4: Migrate rules
```javascript
// Old (.eslintrc.json)
{
  "extends": ["plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}

// New (eslint.config.mjs)
export default [
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
```

### Step 5: Update VSCode settings
Add `"eslint.useFlatConfig": true`

### Step 6: Test and iterate
```bash
npm run lint
```

## Monorepo-Specific Patterns

### Shared Config Package
```javascript
// packages/eslint-config/index.mjs
export default {
  rules: {
    // Shared rules for all projects
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
```

### Import in Projects
```javascript
// apps/api/eslint.config.mjs
import baseConfig from '../../eslint.config.mjs';
import sharedRules from '@myorg/eslint-config';

export default [
  ...baseConfig,
  sharedRules,
];
```

## Verification Checklist
- [ ] ESLint Flat Config file exists (`eslint.config.mjs`)
- [ ] VSCode settings include `eslint.useFlatConfig: true`
- [ ] Prettier is last in config array
- [ ] Auto-fix works on save
- [ ] No parsing errors in ESLint output
- [ ] Nx lint target works correctly

## References
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript ESLint](https://typescript-eslint.io/getting-started)
- [Prettier Integration](https://prettier.io/docs/en/integrating-with-linters.html)
- Related: [ts-node-configuration-patterns.md](./ts-node-configuration-patterns.md)
