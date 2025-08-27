# Mock-First Development Pattern

## Overview
Mock-First Development is a pragmatic approach to building systems with external dependencies by creating lightweight mock implementations during initial development phases.

## When to Apply
- **Early Development**: When external services are not yet available
- **Parallel Development**: Teams working on different services simultaneously
- **Testing**: Creating predictable test environments
- **Demo/PoC**: Quick prototypes without full infrastructure

## Implementation Strategies

### 1. In-Memory Mocks
Simple implementations that store data in memory:
```typescript
// Example: In-memory data store
class MockDataStore {
  private data = new Map();
  
  async get(id: string) {
    return this.data.get(id);
  }
  
  async set(id: string, value: any) {
    this.data.set(id, value);
  }
}
```

### 2. File-Based Mocks
Using JSON or YAML files for mock data:
```typescript
// Example: File-based configuration
const mockData = require('./mocks/users.json');
```

### 3. Network Stub Servers
Standalone mock servers (e.g., json-server, WireMock):
```bash
# Example: Using json-server
npx json-server --watch db.json --port 3001
```

## Best Practices

### Progressive Enhancement
1. **Start Simple**: Begin with hardcoded responses
2. **Add Behavior**: Introduce state and logic as needed
3. **Match Contracts**: Ensure mocks conform to real service contracts
4. **Replace Gradually**: Swap mocks for real services incrementally

### Contract Alignment
- Define interfaces/contracts first
- Mocks must implement the same contracts as real services
- Use type systems to enforce contract compliance
- Version contracts to handle evolution

### Mock Configuration
```typescript
// Example: Environment-based mock switching
const service = process.env.USE_MOCKS === 'true' 
  ? new MockService() 
  : new RealService();
```

## Common Patterns

### Repository Pattern with Mocks
```typescript
interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class MockUserRepository implements UserRepository {
  // Mock implementation
}

class RealUserRepository implements UserRepository {
  // Real implementation
}
```

### Service Layer Mocking
```typescript
interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class MockEmailService implements EmailService {
  async send(to: string, subject: string, body: string) {
    console.log(`Mock: Would send email to ${to}`);
  }
}
```

## Anti-Patterns to Avoid
- **Over-Complex Mocks**: Don't recreate the entire external service
- **Drifting Contracts**: Keep mocks synchronized with real service changes
- **Production Mocks**: Never deploy mocks to production accidentally
- **Stateful Dependencies**: Avoid complex state management in mocks

## Migration Strategy
1. **Identify Integration Points**: Map all external dependencies
2. **Create Interfaces**: Define contracts for each dependency
3. **Implement Mocks**: Build simple mock implementations
4. **Add Feature Flags**: Control mock/real service switching
5. **Progressive Replacement**: Replace mocks one by one
6. **Validate Behavior**: Ensure real services match mock behavior

## Testing Considerations
- Use mocks for unit tests
- Use real services (or sophisticated mocks) for integration tests
- Maintain separate mock configurations for different test scenarios
- Document mock limitations and assumptions

## Example: Task Tracker Service
```typescript
// Contract definition
interface TaskService {
  createTask(task: TaskInput): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

// Mock implementation for development
class MockTaskService implements TaskService {
  private tasks = new Map<string, Task>();
  
  async createTask(input: TaskInput): Promise<Task> {
    const task = {
      id: nanoid(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.set(task.id, task);
    return task;
  }
  
  // ... other methods
}

// Service factory
function createTaskService(): TaskService {
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCKS === 'true') {
    return new MockTaskService();
  }
  return new RealTaskService(/* dependencies */);
}
```

## Benefits
- **Faster Development**: No waiting for external services
- **Predictable Testing**: Controlled test environments
- **Parallel Work**: Teams can work independently
- **Cost Reduction**: No need for full infrastructure during development
- **Resilience**: Development continues even when external services are down

## Considerations
- **Maintenance Overhead**: Mocks need updates when contracts change
- **False Confidence**: Mocks may not capture all real service behaviors
- **Integration Debt**: Eventually need to test with real services
- **Documentation**: Clear documentation of mock vs real differences
