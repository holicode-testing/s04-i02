# TypeScript Patterns for HoliCode (TypeScript/Node.js)

This document outlines common TypeScript patterns and practices specifically for TypeScript/Node.js projects within the HoliCode framework.

## Request Typing Pattern
**Problem**: Global augmentation unreliable in test environments
**Solution**: Local interface types
```typescript
// ❌ Avoid: Global augmentation
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// ✅ Prefer: Local interfaces
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Usage in handlers
export const protectedRoute = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Handle authenticated request
};
```

## Module Resolution Pattern
**Problem**: Cannot find module errors with path aliases
**Solution**: tsconfig path mappings
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@services/*": ["src/services/*"]
    }
  }
}
```

**For test environments**:
```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@services': path.resolve(__dirname, './src/services')
    }
  }
});
```

## Prisma Client Pattern
**Problem**: Custom output path causes import issues
**Solution**: Use default @prisma/client location
```typescript
// ❌ Avoid: Custom output path
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma-client"
}

// ✅ Prefer: Default location
generator client {
  provider = "prisma-client-js"
}

// Import normally
import { PrismaClient } from '@prisma/client';
```

## ESM/CJS Compatibility Pattern
**Problem**: Mixed module systems cause conflicts
**Solution**: Configure for interoperability
```json
// package.json
{
  "type": "module",  // For ESM-first approach
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts"  // tsx handles both ESM and CJS
  }
}
```

```typescript
// tsconfig.json for dual compatibility
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Type Declaration Strategies

### Shared Types Pattern
```typescript
// src/shared/types/index.ts
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

// Import anywhere
import { User, UserRole } from '@shared/types';
```

### Service Contract Types
```typescript
// src/services/UserService/types.ts
export interface UserServiceContract {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  role?: UserRole;
}
```

## Generic Patterns

### Result Type Pattern
```typescript
// src/shared/types/result.ts
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userService.findById(id);
    if (!user) {
      return { success: false, error: new Error('User not found') };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

### Builder Pattern for Complex Objects
```typescript
class QueryBuilder<T> {
  private conditions: Record<string, any> = {};
  
  where(field: keyof T, value: any): this {
    this.conditions[field as string] = value;
    return this;
  }
  
  build(): Record<string, any> {
    return this.conditions;
  }
}

// Usage
const query = new QueryBuilder<User>()
  .where('email', 'test@example.com')
  .where('role', UserRole.ADMIN)
  .build();
