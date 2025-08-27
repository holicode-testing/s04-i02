# Safe Defaults Library

## Purpose
This document provides a collection of safe default solutions for common problems encountered during implementation. When the Tricky Problem Protocol is activated after 3 consecutive failures, these defaults can be applied to maintain progress while documenting limitations.

## When to Use Safe Defaults
- After 3 consecutive failed attempts at solving the same issue
- When escalation to user results in "Apply workaround" option
- When time constraints require pragmatic solutions
- As temporary measures while SPIKE tasks investigate proper solutions

## Common Safe Defaults by Category

### TypeScript Issues

#### Type Augmentation Problems
**Problem**: Module augmentation fails or causes type conflicts
**Safe Default**: Use explicit types instead of augmentation
```typescript
// Instead of augmenting Express Request
// declare module 'express' { interface Request { user?: User } }

// Use explicit interface
interface AuthenticatedRequest extends Request {
  user?: User;
}
```
**Limitation**: Requires casting at usage sites
**Document in**: Component SPEC.md change log

#### Module Resolution Issues
**Problem**: Complex path mappings fail in tsconfig
**Safe Default**: Use relative imports
```typescript
// Instead of: import { User } from '@shared/models'
import { User } from '../../../shared/models';
```
**Limitation**: Verbose imports, harder refactoring
**Document in**: systemPatterns.md

### Configuration Issues

#### Complex TypeScript Config
**Problem**: Advanced tsconfig features cause build failures
**Safe Default**: Minimal working config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
**Limitation**: May miss optimizations
**Document in**: techContext.md

#### ESLint Flat Config Issues
**Problem**: Flat config not working with VSCode
**Safe Default**: Legacy .eslintrc.json
```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2020": true
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  }
}
```
**Limitation**: Missing latest features
**Document in**: Development setup docs

### Docker Issues

#### Container Networking Problems
**Problem**: Services can't communicate in Docker
**Safe Default**: Host networking for development
```yaml
# docker-compose.yml
services:
  api:
    network_mode: host
    environment:
      - DB_HOST=localhost
```
**Limitation**: Not production-ready, port conflicts possible
**Document in**: TD-002 Infrastructure notes

#### Build Context Issues
**Problem**: Docker build fails with complex contexts
**Safe Default**: Simple Dockerfile without multi-stage
```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "start"]
```
**Limitation**: Larger image size, slower builds
**Document in**: Deployment documentation

### Test Mocking Issues

#### Complex Mock Setup Failures
**Problem**: Intricate mocks cause test instability
**Safe Default**: Integration tests instead of unit tests
```typescript
// Instead of complex mocking
// jest.mock('complex-module', () => ({ ... }))

// Use real implementations in test
describe('Integration Test', () => {
  it('tests full flow', async () => {
    // Test actual behavior end-to-end
  });
});
```
**Limitation**: Slower tests, requires test database
**Document in**: Testing strategy in SPEC.md

#### Jest ESM/CJS Conflicts
**Problem**: Mixed module systems cause Jest failures
**Safe Default**: Force CommonJS for tests
```javascript
// jest.config.js (not .mjs)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};
```
**Limitation**: Can't test ESM-specific features
**Document in**: Test setup documentation

### Database/ORM Issues

#### Prisma Engine Problems (ARM64)
**Problem**: Prisma can't find query engine
**Safe Default**: Environment variable workaround
```bash
# .env.development
PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node
```
**Limitation**: Platform-specific, breaks portability
**Document in**: Development environment setup

#### Migration Conflicts
**Problem**: Database migrations fail or conflict
**Safe Default**: Reset and recreate
```bash
# Development only!
npx prisma migrate reset --force
npx prisma db push
npx prisma db seed
```
**Limitation**: Data loss, not for production
**Document in**: Database maintenance docs

### API/Network Issues

#### CORS Problems
**Problem**: Complex CORS requirements fail
**Safe Default**: Permissive CORS for development
```typescript
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```
**Limitation**: Security risk, development only
**Document in**: TD-005 Security notes

#### Authentication Complexity
**Problem**: Complex auth flows fail
**Safe Default**: Simple JWT without refresh
```typescript
// Simple JWT, no refresh tokens
const token = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
```
**Limitation**: Less secure, no token rotation
**Document in**: Security documentation

### Build/Bundle Issues

#### Webpack Complexity
**Problem**: Complex webpack config fails
**Safe Default**: Use defaults or simpler tool
```javascript
// Switch to simpler bundler like esbuild
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js"
  }
}
```
**Limitation**: Less optimization, fewer features
**Document in**: Build configuration docs

#### Monorepo Tooling Issues
**Problem**: Nx/Lerna commands fail
**Safe Default**: Direct npm/yarn commands
```bash
# Instead of: nx run api:build
cd apps/api && npm run build
```
**Limitation**: No caching, slower builds
**Document in**: Monorepo documentation

## Application Protocol

### 1. Recognition
- Same error occurs 3+ times
- Different approaches all fail
- Blocking progress > 15 minutes

### 2. Documentation
Before applying safe default, document in retro-inbox.md:
```markdown
### [Date] - Safe Default Applied: [Issue]
**Problem**: [Detailed description]
**Attempts**: [List 3 failed approaches]
**Safe Default**: [Solution applied]
**Limitations**: [What we're giving up]
**TODO**: Create SPIKE-[issue].md for proper solution
```

### 3. Application
- Apply the safe default from this library
- Add TODO comment in code
- Update relevant SPEC.md change log
- Create SPIKE task if complexity > 4

### 4. Communication
Use ask_followup_question when applying:
```yaml
<ask_followup_question>
<question>Applied safe default for [issue]:
- Solution: [Safe default]
- Trade-off: [Limitation]
- SPIKE created: [Yes/No]

Continue with this workaround?</question>
<options>["Yes, continue", "No, investigate further"]</options>
</ask_followup_question>
```

## Maintenance

### Adding New Defaults
When discovering new safe defaults:
1. Verify it works in 3+ different contexts
2. Document clear limitations
3. Add to appropriate category
4. Include rollback instructions

### Reviewing Defaults
Quarterly review to:
- Remove obsolete defaults
- Update for new tool versions
- Convert repeated defaults to permanent patterns
- Archive solved problems

## Related Documents
- [Tricky Problem Protocol](../../holicode.md#tricky-problem-protocol)
- [Pattern Library](../patterns/)
- [SPIKE Template](../../templates/specs/SPIKE-template.md)
- [Technical Debt Registry](../../.holicode/analysis/decisions/)
