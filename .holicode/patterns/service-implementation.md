# Service Implementation Pattern

## Overview
The "Logic → Router → SPEC → Integrate" pattern provides a systematic approach to implementing services in a testable, maintainable way. These are only examples - there are variety of other reasonable patterns - these are provided as reference ones.

## Implementation Flow

```
1. Logic Layer (Business Rules)
   ↓
2. Router Layer (HTTP/API Endpoints)  
   ↓
3. SPEC Validation (Contract Compliance)
   ↓
4. Integration (Wire Everything Together)
```

## Phase 1: Logic Layer Implementation

### Domain Model First
Start with pure business logic, independent of infrastructure:

```typescript
// src/services/task/TaskService.ts
export class TaskService {
  private tasks: Map<string, Task> = new Map();
  
  createTask(input: CreateTaskInput): Task {
    // Pure business logic - no HTTP, no database
    const task: Task = {
      id: generateId(),
      title: input.title,
      description: input.description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.validateTask(task);
    this.tasks.set(task.id, task);
    return task;
  }
  
  private validateTask(task: Task): void {
    if (!task.title || task.title.length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }
    // Additional validation rules
  }
}
```

### Benefits of Logic-First
- **Testability**: Easy to unit test without mocking infrastructure
- **Portability**: Can be used with different transports (HTTP, GraphQL, CLI)
- **Focus**: Concentrate on business rules without distractions
- **Reusability**: Logic can be shared across different interfaces

## Phase 2: Router Layer Implementation

### HTTP Adapter Pattern
Create a thin HTTP layer that delegates to the logic layer:

```typescript
// src/services/task/TaskRouter.ts
import { Router } from 'express';
import { TaskService } from './TaskService';

export function createTaskRouter(taskService: TaskService): Router {
  const router = Router();
  
  // POST /tasks
  router.post('/tasks', async (req, res, next) => {
    try {
      const task = taskService.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  });
  
  // GET /tasks/:id
  router.get('/tasks/:id', async (req, res) => {
    const task = taskService.getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json(task);
    }
  });
  
  return router;
}
```

### Router Responsibilities
- **Request Parsing**: Extract data from HTTP requests
- **Response Formatting**: Convert domain objects to HTTP responses
- **Error Mapping**: Translate domain errors to HTTP status codes
- **NO Business Logic**: Delegate all logic to the service layer

## Phase 3: SPEC Validation

### Contract-Driven Development
Ensure implementation matches the SPEC.md contract:

```typescript
// src/services/task/SPEC.md
## API Contract

### POST /tasks
Input:
{
  "title": "string, required, min 3 chars",
  "description": "string, optional",
  "priority": "low | medium | high, optional"
}

Output:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Contract Tests
Write tests that verify SPEC compliance:

```typescript
// src/services/task/TaskService.spec.ts
describe('TaskService SPEC Compliance', () => {
  it('should match POST /tasks contract', () => {
    const service = new TaskService();
    const input = {
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high'
    };
    
    const output = service.createTask(input);
    
    // Verify output matches SPEC
    expect(output).toMatchObject({
      id: expect.any(String),
      title: input.title,
      description: input.description,
      status: 'pending',
      priority: 'high',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    });
  });
});
```

## Phase 4: Integration

### Wire Everything Together
Connect all layers in the main application:

```typescript
// src/index.ts
import express from 'express';
import { TaskService } from './services/task/TaskService';
import { createTaskRouter } from './services/task/TaskRouter';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';

async function bootstrap() {
  const app = express();
  
  // Initialize dependencies
  const database = new DatabaseAdapter();
  await database.connect();
  
  // Create services with dependencies
  const taskService = new TaskService(database);
  
  // Mount routers
  app.use('/api', createTaskRouter(taskService));
  
  // Error handling middleware
  app.use(errorHandler);
  
  // Start server
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

bootstrap().catch(console.error);
```

## Anti-Patterns to Avoid

### ❌ Business Logic in Routers
```typescript
// Bad: Business logic in router
router.post('/tasks', (req, res) => {
  // Don't do validation here
  if (req.body.title.length < 3) {
    return res.status(400).json({ error: 'Title too short' });
  }
  // Don't do business calculations here
  const priority = req.body.urgent ? 'high' : 'low';
  // ...
});
```

### ❌ HTTP Concerns in Services
```typescript
// Bad: HTTP status codes in service
class TaskService {
  createTask(input: any): { status: number; body: any } {
    // Services shouldn't know about HTTP
    return { status: 201, body: task };
  }
}
```

### ❌ Tight Coupling
```typescript
// Bad: Direct database access in router
router.post('/tasks', async (req, res) => {
  // Don't access database directly from router
  const result = await db.query('INSERT INTO tasks...');
  res.json(result);
});
```

## Benefits of This Pattern
1. **Separation of Concerns**: Clear boundaries between layers
2. **Testability**: Each layer can be tested independently  
3. **Flexibility**: Easy to add new interfaces (GraphQL, CLI)
4. **Maintainability**: Changes isolated to specific layers
5. **Reusability**: Business logic can be reused across interfaces
6. **SPEC Compliance**: Contract-first ensures API consistency
