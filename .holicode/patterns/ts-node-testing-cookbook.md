# Testing Cookbook for HoliCode Projects (TypeScript/Node.js)

This document outlines common testing patterns and practices specifically for TypeScript/Node.js projects within the HoliCode framework.

## Vitest Configuration Patterns

### Pattern: Basic Vitest Setup
**Problem**: Test environment not configured
**Solution**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '*.config.ts']
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### Pattern: Mocking with vitest-mock-extended
**Problem**: Complex Prisma/service mocking needed
**Solution**:
```typescript
import { mock, MockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('Service with Prisma', () => {
  let prisma: MockProxy<PrismaClient>;
  
  beforeEach(() => {
    prisma = mock<PrismaClient>();
    // Setup specific mock behaviors
    prisma.user.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
  });
});
```

### Pattern: Request Type Mocking
**Problem**: Express Request augmentation in tests
**Solution**:
```typescript
// Local interface instead of global augmentation
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

// Create mock request
const mockReq = {
  user: { id: 'test-id', role: 'admin' },
  body: {},
  params: {},
  query: {}
} as AuthenticatedRequest;
```

## Common Testing Anti-Patterns
- **Global type augmentation in tests**: Use local interfaces instead
- **Over-mocking**: Test real implementations when possible
- **Missing cleanup**: Always clean up test data and mocks
- **Ignoring async behavior**: Properly await all async operations

## Test Organization Patterns
```
src/
  components/
    Auth/
      Auth.ts
      Auth.test.ts      # Co-located unit tests
      SPEC.md
  services/
    UserService/
      UserService.ts
      UserService.test.ts
      UserService.integration.test.ts  # Separate integration tests
      SPEC.md
test/
  e2e/                  # End-to-end tests
  fixtures/             # Shared test data
  helpers/              # Test utilities
```

## Test Naming Conventions
- **Unit tests**: `{component}.test.ts`
- **Integration tests**: `{component}.integration.test.ts`
- **E2E tests**: `{feature}.e2e.test.ts`

## Coverage Guidelines
- **Target**: 80% code coverage for new code
- **Critical paths**: 100% coverage for auth, payments, data operations
- **UI components**: Focus on behavior, not implementation details
