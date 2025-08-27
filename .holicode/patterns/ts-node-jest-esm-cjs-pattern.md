# Jest + ESM/CJS in Nx Monorepo Pattern

## Problem Statement
Mixed ESM/CJS module systems in a TypeScript Nx monorepo cause Jest failures with symptoms like:
- `Cannot use import statement outside a module`
- `require is not defined`
- `graceful-fs substr` errors
- Transform failures for TypeScript/TSX files

## Root Causes
- Jest defaults to CommonJS while modern tooling trends toward ESM
- Nx workspace packages need special handling in Jest
- Node.js version incompatibilities with certain Jest dependencies
- pnpm's strict node_modules structure exposes resolution issues

## Solution Pattern

### 1. Use .cjs Extension for All Jest Presets
```javascript
// jest.preset.cjs (root level)
module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    }],
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}'],
};
```

### 2. Project-Level Jest Config
```typescript
// apps/web/jest.config.ts
export default {
  displayName: 'web',
  preset: '../../jest.preset.cjs', // Note: .cjs extension
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        target: 'es2022',
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@holicode-test/(.*)$': '<rootDir>/../../libs/$1/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
};
```

### 3. Handle import.meta for Vite Projects
```typescript
// apps/web/src/test-setup.ts
// Polyfill import.meta for Jest
if (typeof import.meta === 'undefined') {
  (global as any).import = { meta: { env: process.env } };
}
```

### 4. Transform Configuration for Workspace Packages
```javascript
// Ensure workspace packages are transformed
transformIgnorePatterns: [
  'node_modules/(?!(@holicode-test)/)',
],
```

## Common Gotchas

### 1. Incorrect Module Resolution
**Issue**: Cannot find module '@holicode-test/shared'
**Fix**: Ensure moduleNameMapper points to source files:
```javascript
moduleNameMapper: {
  '^@holicode-test/(.*)$': '<rootDir>/../../libs/$1/src/index.ts',
}
```

### 2. SWC Target Mismatch
**Issue**: Syntax errors in tests
**Fix**: Set appropriate ECMAScript target:
```javascript
jsc: {
  target: 'es2022', // or 'es2020' for broader compatibility
}
```

### 3. Missing Test Environment
**Issue**: `document is not defined` in web tests
**Fix**: Set correct test environment:
```javascript
testEnvironment: 'jsdom', // for web
testEnvironment: 'node',  // for API
```

### 4. Graceful-fs Substr Error
**Issue**: `TypeError: Cannot read properties of undefined (reading 'substr')`
**Fix**: 
- Ensure Node.js 20.x
- Clear Jest cache: `nx reset`
- Set process globals in setup:
```typescript
// test-setup.ts
global.process = process;
```

## Verification Checklist
- [ ] All preset files use `.cjs` extension
- [ ] Transform includes TS/TSX files
- [ ] Module mapper configured for workspace packages
- [ ] Test environment appropriate for project type
- [ ] Setup files handle polyfills
- [ ] Transform ignore patterns exclude workspace packages

## Migration Path
1. Rename all `jest.preset.js` to `jest.preset.cjs`
2. Update all project configs to reference `.cjs` presets
3. Add SWC transforms for better performance
4. Configure module mappers for workspace structure
5. Add setup files for environment-specific needs
6. Test incrementally: unit → integration → e2e

## References
- [Jest ESM Support](https://jestjs.io/docs/ecmascript-modules)
- [Nx Jest Plugin](https://nx.dev/packages/jest)
- [SWC Jest Transform](https://swc.rs/docs/usage/jest)
- Related: [ts-node-testing-cookbook.md](./ts-node-testing-cookbook.md)
