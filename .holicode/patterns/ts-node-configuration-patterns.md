# Configuration Patterns for HoliCode (TypeScript/Node.js)

This document outlines common configuration patterns and practices specifically for TypeScript/Node.js projects within the HoliCode framework.

## Monorepo Configuration

### Pattern: Simple Monorepo Setup
**Problem**: Multiple related packages need shared configuration
**Solution**: Root-level configuration with package-specific overrides

```json
// Root package.json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Pattern: ESLint Configuration
**Problem**: Inconsistent code style across packages
**Solution**: Shared ESLint configuration

```javascript
// .eslintrc.js (root)
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true
  },
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.config.js']
};
```

### Pattern: Prettier Configuration
**Problem**: Formatting conflicts between developers
**Solution**: Shared Prettier configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## TypeScript Configuration

### Pattern: Base TypeScript Config
```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## Git Configuration

### Pattern: Comprehensive .gitignore
```gitignore
# Dependencies
node_modules/
bower_components/

# Build outputs
dist/
build/
out/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/
*.lcov

# Temporary files
tmp/
temp/
.tmp/
.cache/

# OS files
Thumbs.db
```

## Package.json Scripts Organization

### Pattern: Organized Script Structure
```json
{
  "scripts": {
    "// Development": "",
    "dev": "tsx watch src/index.ts",
    "dev:debug": "tsx --inspect watch src/index.ts",
    
    "// Building": "",
    "build": "tsc",
    "build:clean": "rimraf dist",
    "build:watch": "tsc --watch",
    
    "// Testing": "",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    
    "// Code Quality": "",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    
    "// Database": "",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx src/seeds/index.ts",
    "db:reset": "prisma migrate reset",
    
    "// Utilities": "",
    "clean": "rimraf dist coverage .turbo",
    "preinstall": "npx only-allow pnpm",
    "prepare": "husky install"
  }
}
```

## Environment Configuration

### Pattern: Structured Environment Variables
```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);

// Type-safe environment variables throughout the app
export type Env = z.infer<typeof envSchema>;
