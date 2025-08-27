# Prisma Engine on ARM64 with Nx Pattern

## Problem Statement
Prisma Client fails to locate its Query Engine on ARM64 Linux systems, particularly in Nx monorepos with webpack bundling:
- `PrismaClientInitializationError: Query engine library for current platform "linux-arm64-openssl-3.0.x" could not be found`
- Engine binary exists but isn't found at runtime
- Webpack bundling doesn't properly handle native binaries

## Root Causes
- Webpack doesn't copy native binaries to dist by default
- Prisma's engine discovery relies on file system paths
- ARM64 binaries have different paths than x86_64
- pnpm's strict linking can complicate binary resolution

## Solution Pattern

### 1. Development Environment Variable
```bash
# apps/api/.env.serve.local
PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node

# For different platforms:
# macOS M1/M2:
# PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/prisma/libquery_engine-darwin-arm64.dylib.node
# Linux x64:
# PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/prisma/libquery_engine-debian-openssl-3.0.x.so.node
```

### 2. Platform Detection in Code
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { platform, arch } from 'os';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Set engine path for ARM64 if not already set
    if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY && 
        platform() === 'linux' && 
        arch() === 'arm64') {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = 
        './node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node';
    }
    
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### 3. Schema Configuration
```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-arm64-openssl-3.0.x", "debian-openssl-3.0.x"]
  // Include all target platforms your team uses
}
```

### 4. Build-Time Solution (Production)
```javascript
// apps/api/webpack.config.js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // ... other config
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/.prisma/client/*.node',
          to: 'prisma/[name][ext]',
          noErrorOnMissing: true,
        },
        {
          from: 'node_modules/prisma/*.node',
          to: 'prisma/[name][ext]',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
  },
};
```

### 5. Docker Solution
```dockerfile
# Dockerfile
FROM node:20 AS builder
WORKDIR /app

# Install Prisma CLI and generate client
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# Copy generated client to final stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
```

## Common Gotchas

### 1. Module System Conflicts
**Issue**: `ERR_MODULE_NOT_FOUND` when using `type: "module"`
**Fix**: Remove `"type": "module"` from root package.json for NestJS projects

### 2. Wrong Binary Architecture
**Issue**: Engine works locally but fails in Docker
**Fix**: Ensure Docker base image matches deployment architecture

### 3. Missing Binary After npm install
**Issue**: Binary not downloaded during install
**Fix**: Run `npx prisma generate` after install:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 4. pnpm Store Issues
**Issue**: Binary in wrong location with pnpm
**Fix**: Use pnpm's public hoisting for Prisma:
```yaml
# .npmrc
public-hoist-pattern[]=@prisma/client
public-hoist-pattern[]=prisma
```

## Verification Checklist
- [ ] Correct binary targets in schema.prisma
- [ ] Environment variable set for development
- [ ] Platform detection logic for runtime
- [ ] Build process copies native binaries
- [ ] Docker images include correct binaries
- [ ] postinstall script generates client

## Platform Matrix
| Platform | Architecture | Binary Name | OpenSSL |
|----------|-------------|-------------|---------|
| Linux | ARM64 | libquery_engine-linux-arm64-openssl-3.0.x.so.node | 3.0.x |
| Linux | x64 | libquery_engine-debian-openssl-3.0.x.so.node | 3.0.x |
| macOS | ARM64 | libquery_engine-darwin-arm64.dylib.node | N/A |
| macOS | x64 | libquery_engine-darwin.dylib.node | N/A |
| Windows | x64 | query_engine-windows.dll.node | N/A |

## Migration Path
1. Add all target platforms to schema.prisma
2. Set up environment variables for development
3. Add platform detection to PrismaService
4. Configure webpack/build tool to copy binaries
5. Test on all target platforms
6. Document platform requirements

## References
- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets)
- [Prisma in Production](https://www.prisma.io/docs/guides/deployment/deployment)
- Related: [ts-node-docker-patterns.md](./ts-node-docker-patterns.md)
