# Supabase Patterns

## Problem Statement
Common challenges when integrating Supabase in applications:
- Local development setup with Supabase CLI
- Authentication flow implementation (JWT, sessions, refresh tokens)
- Token handling and propagation between frontend and backend
- Database connection and migration management
- Real-time subscriptions setup
- Row Level Security (RLS) implementation
- ARM64/pnpm CLI binary issues

## Local Development Setup

### 1. Supabase CLI Installation
```bash
# Using pnpm dlx to avoid binary linking issues
pnpm dlx supabase init

# Or install globally with npm
npm install -g supabase

# For ARM64 systems with pnpm issues
# Use npm for global tools or pnpm dlx for one-time execution
```

### 2. Local Development Configuration
```bash
# Initialize Supabase project
supabase init

# Start local Supabase stack
supabase start

# This starts:
# - PostgreSQL database (port 54322)
# - Auth service (port 54321)
# - Storage service
# - Realtime service
# - Studio UI (port 54323)
```

### 3. Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-start
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Authentication Patterns

### 1. Client-Side Authentication (React/Next.js)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Usage in component
const supabase = createClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      name: 'User Name',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// OAuth sign in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### 2. Server-Side Authentication (Node.js/NestJS)
```typescript
// services/supabase/supabase.service.ts
import { Injectable } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  getClient(): SupabaseClient {
    return this.supabase
  }

  async getUser(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token)
    return { user, error }
  }
}
```

### 3. JWT Token Handling
```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'

interface AuthenticatedRequest extends Request {
  user?: any
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const { user, error } = await supabaseService.getUser(token)
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  req.user = user
  next()
}
```

## Database Patterns

### 1. Connection Management
```typescript
// Direct database connection (for migrations, admin tasks)
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

// Supabase client for API operations
const supabase = createClient(url, key)

// Direct PostgreSQL connection for complex queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Use Supabase client for most operations
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// Use direct connection for complex operations
const result = await pool.query(
  'SELECT * FROM users WHERE created_at > $1',
  [lastWeek]
)
```

### 2. Database Migrations
```bash
# Create a new migration
supabase migration new create_users_table

# Run migrations locally
supabase db reset

# Push to remote
supabase db push

# Pull remote schema
supabase db pull
```

### 3. Row Level Security (RLS)
```sql
-- Enable RLS on table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
```

## Real-time Subscriptions

### 1. Client-Side Subscriptions
```typescript
// Subscribe to changes
const channel = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
await supabase.removeChannel(channel)

// Presence (who's online)
const presenceChannel = supabase.channel('room1')

presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    console.log('Online users:', state)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      })
    }
  })
```

### 2. Server-Side Subscriptions
```typescript
// Listen for database changes server-side
const subscription = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    async (payload) => {
      // Send push notification, email, etc.
      await sendNotification(payload.new)
    }
  )
  .subscribe()
```

## Storage Patterns

### 1. File Upload
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`public/${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`public/${userId}/avatar.png`)

// Download file
const { data, error } = await supabase.storage
  .from('avatars')
  .download(`public/${userId}/avatar.png`)
```

### 2. Storage Policies
```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## Common Gotchas

### 1. ARM64 Binary Issues with pnpm
**Issue**: Supabase CLI binary not found when installed with pnpm
**Solution**:
```bash
# Use npm for global installation
npm install -g supabase

# Or use pnpm dlx for one-time execution
pnpm dlx supabase init
pnpm dlx supabase start
```

### 2. CORS Issues in Local Development
**Issue**: CORS errors when calling Supabase from localhost
**Solution**:
```typescript
// Ensure correct URL format (no trailing slash)
const supabase = createClient(
  'http://localhost:54321', // Not 'http://localhost:54321/'
  'your-anon-key'
)
```

### 3. Token Expiration Handling
**Issue**: Access tokens expire after 1 hour by default
**Solution**:
```typescript
// Auto-refresh on client
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Manual refresh
const { data, error } = await supabase.auth.refreshSession()
const { session, user } = data
```

### 4. RLS Blocking Queries
**Issue**: Queries return empty results due to RLS policies
**Solution**:
```typescript
// Use service role key for admin operations
const supabaseAdmin = createClient(
  url,
  serviceRoleKey, // Bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### 5. Migration Conflicts
**Issue**: Local and remote schemas out of sync
**Solution**:
```bash
# Reset local database
supabase db reset

# Or pull remote schema
supabase db pull

# Diff local vs remote
supabase db diff
```

## Edge Functions Pattern

### 1. Creating Edge Functions
```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { name } = await req.json()
  
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    }
  )
})
```

### 2. Deploying and Invoking
```bash
# Deploy function
supabase functions deploy hello

# Invoke locally
supabase functions invoke hello --body '{"name":"World"}'

# Invoke from client
const { data, error } = await supabase.functions.invoke('hello', {
  body: { name: 'World' }
})
```

## Testing Patterns

### 1. Test Environment Setup
```typescript
// test/setup.ts
import { createClient } from '@supabase/supabase-js'

const testSupabase = createClient(
  'http://localhost:54321',
  'your-anon-key-from-supabase-start'
)

beforeEach(async () => {
  // Clean test data
  await testSupabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
})

afterAll(async () => {
  // Cleanup
  await testSupabase.auth.signOut()
})
```

### 2. Mocking Supabase
```typescript
// __mocks__/@supabase/supabase-js.ts
export const createClient = jest.fn(() => ({
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}))
```

## Performance Optimization

### 1. Connection Pooling
```typescript
// For high-traffic applications
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-value' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 2. Query Optimization
```typescript
// Use select to limit fields
const { data } = await supabase
  .from('users')
  .select('id, name, email') // Only needed fields
  .range(0, 9) // Pagination
  .order('created_at', { ascending: false })

// Use RPC for complex queries
const { data } = await supabase
  .rpc('get_user_with_posts', { user_id: userId })
```

## References
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- Related: [nestjs-patterns.md](./nestjs-patterns.md)
- Related: [security-checklist.md](./security-checklist.md)
