# Nx Monorepo Patterns

## Problem Statement
Common challenges when working with Nx monorepos:
- CLI execution strategy confusion (nx vs npx vs pnpm)
- Target configuration and argument forwarding
- Workspace organization decisions
- Caching and optimization setup
- Dependency management between projects
- Build and test orchestration

## CLI Execution Strategy

### Standard Pattern: pnpm nx run
```bash
# Preferred pattern for all Nx commands
pnpm nx run api:serve
pnpm nx run web:test
pnpm nx run shared-ui:build

# With arguments
pnpm nx run api:prisma -- generate
pnpm nx run api:supabase -- start
```

### External Tools via pnpm dlx
```bash
# For tools not installed locally (avoids bin linking issues)
pnpm dlx prisma migrate dev
pnpm dlx supabase init
pnpm dlx create-nx-workspace
```

### Why This Pattern?
- Avoids pnpm's strict node_modules/.bin linking issues
- Works consistently across platforms (especially ARM64)
- Leverages Nx's caching and orchestration
- Clear separation between Nx commands and external tools

## Target Configuration

### 1. Basic Target for command pass through

it provides access to inner node modules bin path and auto append args
```json
// apps/api/project.json
{
  "targets": {
    "prisma": {
      "options": {
        "cwd": "apps/api",
      },
      "command": "prisma",
    }
  }
}
```

### 2. Advanced/Complex Target with Dependencies
```json
{
  "targets": {
    "serve": {
      "executor": "@nx/node:node",
      "options": {
        "buildTarget": "api:build"
      },
      "dependsOn": ["^build", "prisma-generate"]
    },
    "prisma-generate": {
      "options": {
        "cwd": "apps/api"
      },
      "command": "prisma generate",
    }
  }
}
```

### 3. Target Defaults in nx.json
```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^default", "{workspaceRoot}/jest.preset.cjs"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  }
}
```

## Workspace Organization

### 1. Simple Structure (Small Projects)
```
myapp/
├── apps/
│   ├── web/
│   └── api/
├── libs/
│   └── shared/
├── nx.json
└── package.json
```

### 2. Domain-Driven Structure (Medium Projects)
```
myapp/
├── apps/
│   ├── customer-portal/
│   └── admin-dashboard/
├── libs/
│   ├── auth/
│   │   ├── feature/
│   │   ├── data-access/
│   │   └── ui/
│   ├── products/
│   │   ├── feature/
│   │   ├── data-access/
│   │   └── ui/
│   └── shared/
│       ├── ui/
│       ├── util/
│       └── types/
├── nx.json
└── package.json
```

### 3. Type-Based Structure (Large Projects)
```
myapp/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
├── libs/
│   ├── feature/
│   │   ├── auth/
│   │   └── products/
│   ├── data-access/
│   │   ├── auth/
│   │   └── products/
│   ├── ui/
│   │   ├── auth/
│   │   └── products/
│   └── shared/
│       ├── types/
│       └── util/
├── nx.json
└── package.json
```

## pnpm Workspace Configuration

### 1. Basic pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'libs/*'
  - 'libs/*/*'  # For nested library structure
```

### 2. Package.json for Apps
```json
// apps/api/package.json
{
  "name": "@myapp/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "node dist/main.js",
    "test": "jest"
  }
}
```

### 3. Handling Binary Dependencies
```yaml
# .npmrc
# Public hoist patterns for problematic packages
public-hoist-pattern[]=@prisma/client
public-hoist-pattern[]=prisma
public-hoist-pattern[]=*types*
```

## Caching Strategy

### 1. Configure Cacheable Operations
```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "test",
          "lint",
          "e2e"
        ]
      }
    }
  }
}
```

### 2. Input Configuration
```json
{
  "namedInputs": {
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/jest.config.ts"
    ],
    "testing": [
      "default",
      "{workspaceRoot}/jest.preset.cjs",
      "{projectRoot}/jest.config.ts"
    ]
  }
}
```

### 3. Output Configuration
```json
{
  "targets": {
    "build": {
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    }
  }
}
```

## Dependency Management

### 1. Implicit Dependencies
```json
// apps/web/project.json
{
  "implicitDependencies": ["api"],
  "targets": {
    "serve": {
      "dependsOn": ["api:serve"]
    }
  }
}
```

### 2. Project Dependencies
```typescript
// libs/shared/ui/src/index.ts
export * from './lib/button';
export * from './lib/card';

// apps/web/src/app.tsx
import { Button } from '@myapp/shared-ui';
```

### 3. Boundary Enforcement
```json
// nx.json
{
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "libs"
  },
  "affected": {
    "defaultBase": "main"
  }
}
```

## Build Orchestration

### 1. Parallel Execution
```bash
# Build all projects in parallel
pnpm nx run-many --target=build --all --parallel

# With max parallel limit
pnpm nx run-many --target=build --all --parallel=3
```

### 2. Affected Commands
```bash
# Only build affected by changes
pnpm nx affected --target=build

# Test only affected
pnpm nx affected --target=test

# With base comparison
pnpm nx affected --target=build --base=main --head=HEAD
```

### 3. Task Pipeline
```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build", "generate-types"]
    },
    "serve": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## CI/CD Integration

### 1. GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm nx affected --target=lint --base=origin/main
      - run: pnpm nx affected --target=test --base=origin/main
      - run: pnpm nx affected --target=build --base=origin/main
```

### 2. Nx Cloud (Optional)
```bash
# Enable distributed caching
pnpm nx g @nrwl/nx-cloud:init

# In CI, use read-only token
NX_CLOUD_ACCESS_TOKEN=${{ secrets.NX_CLOUD_TOKEN }}
```

## Common Issues & Solutions

### Issue 1: "Command not found" with pnpm
**Fix**: Use `pnpm dlx` for external tools
```bash
# Wrong
pnpm prisma generate

# Correct
pnpm dlx prisma generate
```

### Issue 2: Target not found
**Fix**: Ensure project.json has the target defined
```json
{
  "targets": {
    "your-target": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo 'Hello'"
      }
    }
  }
}
```

### Issue 3: Cache invalidation
**Fix**: Clear Nx cache
```bash
pnpm nx reset
```

### Issue 4: Circular dependencies
**Fix**: Use type-only imports or restructure
```typescript
// Use type-only import to break circular dependency
import type { User } from '@myapp/auth';
```

## Migration from Standalone to Nx

### Step 1: Initialize Nx
```bash
npx nx@latest init
```

### Step 2: Generate workspace
```bash
pnpm dlx create-nx-workspace@latest myapp --preset=apps
```

### Step 3: Migrate existing code
```bash
# Generate new app
pnpm nx g @nx/node:app api

# Move existing code
mv src/* apps/api/src/
```

### Step 4: Configure targets
Add project.json with appropriate targets

### Step 5: Update imports
Change relative imports to workspace imports

## References
- [Nx Documentation](https://nx.dev/)
- [Nx CLI Reference](https://nx.dev/reference/commands)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- Related: [ts-node-configuration-patterns.md](./ts-node-configuration-patterns.md)
