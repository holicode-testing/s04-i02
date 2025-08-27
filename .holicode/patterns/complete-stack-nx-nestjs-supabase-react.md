# Complete Stack Pattern: Nx + NestJS + Supabase + React

## Problem Statement
Building a full-stack application with modern tooling presents challenges:
- End-to-end type safety across frontend and backend
- Authentication token propagation through layers
- CORS configuration for local development
- Shared library management in monorepo
- Consistent testing strategy across stack
- CI/CD pipeline configuration
- Development vs production environment management

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Nx Monorepo                          │
├─────────────────────────────────────────────────────────┤
│  apps/                                                  │
│    ├── web/ (React)                                    │
│    ├── api/ (NestJS)                                   │
│    └── admin/ (React Admin)                            │
│                                                         │
│  libs/                                                  │
│    ├── shared/types/        (TypeScript interfaces)    │
│    ├── shared/utils/        (Common utilities)         │
│    ├── ui/components/       (React components)         │
│    └── data-access/         (API clients)              │
│                                                         │
│  Infrastructure:                                        │
│    ├── Supabase (Auth + DB + Storage)                  │
│    └── Docker Compose (Local Dev)                      │
└─────────────────────────────────────────────────────────┘
```

## Project Setup

### 1. Initialize Nx Workspace
```bash
# Create new workspace
pnpm dlx create-nx-workspace@latest myapp --preset=apps

# Add plugins
pnpm add -D @nx/react @nx/nest @nx/node

# Generate applications
pnpm nx g @nx/react:app web
pnpm nx g @nx/nest:app api
```

### 2. Project Structure
```
myapp/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/           # Supabase client
│   │   │   └── main.tsx
│   │   └── project.json
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── app/
│       │   ├── auth/
│       │   ├── users/
│       │   └── main.ts
│       └── project.json
│
├── libs/
│   ├── shared/
│   │   └── types/             # Shared TypeScript types
│   │       ├── src/
│   │       │   ├── dto/
│   │       │   ├── entities/
│   │       │   └── index.ts
│   │       └── project.json
│   │
│   └── ui/
│       └── components/        # Shared React components
│           ├── src/
│           └── project.json
│
├── nx.json
├── package.json
└── tsconfig.base.json
```

## Shared Types Configuration

### 1. Define Shared Types
```typescript
// libs/shared/types/src/entities/user.entity.ts
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// libs/shared/types/src/dto/auth.dto.ts
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto extends LoginDto {
  name?: string
}

export interface AuthResponse {
  user: User
  session: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
}
```

### 2. Configure TypeScript Paths
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@myapp/shared/types": ["libs/shared/types/src/index.ts"],
      "@myapp/ui/components": ["libs/ui/components/src/index.ts"]
    }
  }
}
```

## Authentication Flow

### 1. Frontend Authentication (React)
```typescript
// apps/web/src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@myapp/shared/types'

export const supabase = createBrowserClient(
  process.env.NX_PUBLIC_SUPABASE_URL!,
  process.env.NX_PUBLIC_SUPABASE_ANON_KEY!
)

// apps/web/src/hooks/useAuth.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, AuthResponse } from '@myapp/shared/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User | null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user as User | null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data as AuthResponse
  }

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signIn, signOut }
}
```

### 2. API Authentication (NestJS)
```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './jwt.strategy'
import { SupabaseModule } from '../supabase/supabase.module'

@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}

// apps/api/src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { SupabaseService } from '../supabase/supabase.service'
import type { User } from '@myapp/shared/types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        const { user, error } = await this.supabaseService.getUser(rawJwtToken)
        
        if (error || !user) {
          return done(new Error('Unauthorized'), false)
        }
        
        return done(null, process.env.SUPABASE_JWT_SECRET)
      },
      passReqToCallback: true,
    })
  }

  async validate(req: any, payload: any): Promise<User> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    const { user } = await this.supabaseService.getUser(token)
    return user as User
  }
}
```

## API Client Configuration

### 1. Frontend API Client
```typescript
// libs/data-access/src/lib/api-client.ts
import type { User } from '@myapp/shared/types'

class ApiClient {
  private baseUrl = process.env.NX_PUBLIC_API_URL || 'http://localhost:3000'
  
  private async getAuthHeader(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeader()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getAuthHeader()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const apiClient = new ApiClient()
```

### 2. React Query Integration
```typescript
// apps/web/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@myapp/data-access'
import type { User } from '@myapp/shared/types'

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiClient.get<User[]>('/api/users'),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      apiClient.put<User>(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

## CORS Configuration

### 1. NestJS CORS Setup
```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))
  
  const port = process.env.PORT || 3000
  await app.listen(port)
}

bootstrap()
```

### 2. Development Proxy Configuration
```json
// apps/web/project.json
{
  "targets": {
    "serve": {
      "options": {
        "proxyConfig": "apps/web/proxy.conf.json"
      }
    }
  }
}

// apps/web/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

## Testing Strategy

### 1. Unit Tests (Components)
```typescript
// apps/web/src/components/UserProfile.spec.tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'
import type { User } from '@myapp/shared/types'

const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('UserProfile', () => {
  it('should render user information', () => {
    render(<UserProfile user={mockUser} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests (API)
```typescript
// apps/api/src/users/users.controller.spec.ts
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app/app.module'

describe('Users API', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  it('/api/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', 'Bearer test-token')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true)
      })
  })

  afterAll(async () => {
    await app.close()
  })
})
```

### 3. E2E Tests (Cypress)
```typescript
// apps/web-e2e/src/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  it('should login successfully', () => {
    cy.visit('/')
    cy.get('[data-testid="login-email"]').type('test@example.com')
    cy.get('[data-testid="login-password"]').type('password')
    cy.get('[data-testid="login-submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome back')
  })
})
```

## CI/CD Configuration

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
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
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup Supabase
        run: |
          pnpm dlx supabase init
          pnpm dlx supabase start
      
      - name: Run affected tests
        run: pnpm nx affected --target=test --base=origin/main
      
      - name: Run affected lint
        run: pnpm nx affected --target=lint --base=origin/main
      
      - name: Run affected build
        run: pnpm nx affected --target=build --base=origin/main
      
      - name: Run E2E tests
        run: pnpm nx affected --target=e2e --base=origin/main
```

### 2. Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      target: development
    ports:
      - "4200:4200"
    volumes:
      - ./apps/web:/app/apps/web
      - /app/node_modules
    environment:
      - NX_PUBLIC_SUPABASE_URL=http://supabase:54321
      - NX_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - api
      - supabase

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./apps/api:/app/apps/api
      - ./libs:/app/libs
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
      - SUPABASE_URL=http://supabase:54321
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  supabase:
    image: supabase/postgres:15.1.0.117
    environment:
      - POSTGRES_PASSWORD=postgres
    ports:
      - "54321:54321"
      - "54322:5432"
    volumes:
      - supabase_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  supabase_data:
```

## Environment Management

### 1. Environment Variables Structure
```bash
# .env.local (development)
NX_PUBLIC_SUPABASE_URL=http://localhost:54321
NX_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NX_PUBLIC_API_URL=http://localhost:3000

# Backend specific
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# .env.production
NX_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NX_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NX_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Nx Configuration
```json
// apps/web/project.json
{
  "targets": {
    "serve": {
      "configurations": {
        "development": {
          "fileReplacements": [],
          "buildTarget": "web:build:development"
        },
        "production": {
          "fileReplacements": [
            {
              "replace": "apps/web/src/environments/environment.ts",
              "with": "apps/web/src/environments/environment.prod.ts"
            }
          ],
          "buildTarget": "web:build:production"
        }
      }
    }
  }
}
```

## Common Pitfalls & Solutions

### 1. Type Synchronization
**Problem**: Types drift between frontend and backend
**Solution**: Use shared types library and enforce through CI
```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build", "type-check"]
    }
  }
}
```

### 2. Token Refresh Handling
**Problem**: API calls fail when token expires
**Solution**: Implement interceptor for token refresh
```typescript
// libs/data-access/src/lib/interceptors.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data } = await supabase.auth.refreshSession()
      if (data.session) {
        // Retry original request
        return apiClient.request(error.config)
      }
    }
    return Promise.reject(error)
  }
)
```

### 3. Development vs Production Database
**Problem**: Schema drift between environments
**Solution**: Use Supabase migrations
```bash
# Always develop with migrations
supabase migration new add_user_profile
supabase db push # Apply to local
supabase db push --remote # Apply to production
```

### 4. Nx Cache Issues
**Problem**: Cached builds with stale environment variables
**Solution**: Include env files in cache inputs
```json
// nx.json
{
  "namedInputs": {
    "production": [
      "default",
      "{workspaceRoot}/.env.production"
    ]
  }
}
```

## Performance Optimization

### 1. Bundle Splitting
```typescript
// apps/web/src/app/app.tsx
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  )
}
```

### 2. API Response Caching
```typescript
// apps/api/src/users/users.controller.ts
import { CacheInterceptor } from '@nestjs/cache-manager'

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  @Get()
  @CacheTTL(300) // 5 minutes
  async findAll() {
    return this.usersService.findAll()
  }
}
```

## References
- [Nx Documentation](https://nx.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- Related patterns:
  - [nx-monorepo-patterns.md](./nx-monorepo-patterns.md)
  - [nestjs-patterns.md](./nestjs-patterns.md)
  - [supabase-patterns.md](./supabase-patterns.md)
  - [docker-containerization.md](./docker-containerization.md)
