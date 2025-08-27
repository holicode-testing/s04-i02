# Verification Tools Pattern

## Overview
A systematic approach to validating implementation correctness using appropriate tools for different verification needs. These are only examples - there are variety of other methods.

## Tool Selection Matrix

| Verification Need | Recommended Tool | When to Use |
|------------------|------------------|-------------|
| API Testing | `curl`, `httpie`, Postman | REST endpoints, HTTP services |
| UI Testing | Browser DevTools, Playwright | Web applications, visual validation |
| CLI Testing | Direct execution, `expect` | Command-line tools, scripts |
| Integration Testing | Docker Compose, test suites | Multi-service interactions |
| Performance Testing | `ab`, `k6`, JMeter | Load testing, benchmarking |
| Security Testing | OWASP ZAP, `nmap` | Security validation |

## Common Verification Patterns

### 1. API Endpoint Verification
```bash
# Basic health check
curl http://localhost:3000/health

# POST with JSON data
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing API"}'

# Verify response headers
curl -I http://localhost:3000/api/tasks

# Using httpie (more readable)
http POST localhost:3000/api/tasks title="Test Task" description="Testing API"
```

### 2. Browser-Based Verification
```javascript
// Browser console testing
fetch('/api/tasks')
  .then(res => res.json())
  .then(data => console.log(data));

// Local storage inspection
localStorage.getItem('authToken');

// Network tab monitoring
// - Check request/response payloads
// - Verify headers
// - Monitor performance metrics
```

### 3. Database Verification
```sql
-- Direct database queries
SELECT * FROM tasks WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check constraints
\d tasks  -- PostgreSQL
DESCRIBE tasks;  -- MySQL

-- Verify indexes
SHOW INDEXES FROM tasks;
```

### 4. File System Verification
```bash
# Check generated files
ls -la dist/
tree src/

# Verify file contents
cat package.json | jq '.scripts'

# Check file permissions
stat src/index.js

# Monitor file changes
fswatch -o src/ | xargs -n1 -I{} echo "File changed"
```

## Verification Workflows

### Development Verification Flow
1. **Unit Tests**: Fastest feedback loop
   ```bash
   npm test -- --watch
   ```

2. **Integration Tests**: Service interactions
   ```bash
   npm run test:integration
   ```

3. **Manual Smoke Tests**: Critical paths
   ```bash
   # Start services
   docker-compose up -d
   
   # Run smoke tests
   ./scripts/smoke-test.sh
   ```

4. **End-to-End Tests**: Full user scenarios
   ```bash
   npm run test:e2e
   ```

### Production Readiness Verification
```bash
# 1. Build verification
npm run build
ls -la dist/

# 2. Environment configuration
env | grep NODE_
cat .env.production

# 3. Dependency audit
npm audit
npm outdated

# 4. Performance baseline
npm run perf:test

# 5. Security scan
npm run security:scan
```

## Test Data Management

### Seed Data Creation
```javascript
// Create consistent test data
const seedData = {
  users: [
    { id: 'user-1', name: 'Alice', role: 'admin' },
    { id: 'user-2', name: 'Bob', role: 'user' }
  ],
  tasks: [
    { id: 'task-1', userId: 'user-1', title: 'Setup project' },
    { id: 'task-2', userId: 'user-2', title: 'Write tests' }
  ]
};

// Reset and seed database
async function resetDatabase() {
  await db.truncate(['users', 'tasks']);
  await db.seed(seedData);
}
```

### Test Isolation
```javascript
describe('Task Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  test('should create task', async () => {
    // Isolated test with known state
  });
});
```

## Verification Checklist Templates

### API Service Verification
- [ ] Health endpoint responds with 200
- [ ] CRUD operations work correctly
- [ ] Error responses have correct status codes
- [ ] Response formats match specifications
- [ ] Authentication/authorization enforced
- [ ] Rate limiting active (if applicable)
- [ ] CORS configured correctly
- [ ] API documentation accessible

### Frontend Application Verification
- [ ] Application loads without console errors
- [ ] Navigation works correctly
- [ ] Forms validate and submit properly
- [ ] Error states display appropriately
- [ ] Loading states show during async operations
- [ ] Responsive design works across breakpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Browser compatibility verified

### Database Verification
- [ ] Schema matches specifications
- [ ] Indexes created for query optimization
- [ ] Constraints enforce data integrity
- [ ] Migrations run successfully
- [ ] Backup/restore procedures work
- [ ] Connection pooling configured
- [ ] Query performance acceptable

## Automated Verification Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

SERVICES=("http://localhost:3000" "http://localhost:3001" "http://localhost:5432")

for service in "${SERVICES[@]}"; do
  if curl -f -s "$service/health" > /dev/null; then
    echo "✅ $service is healthy"
  else
    echo "❌ $service is not responding"
    exit 1
  fi
done
```

### Continuous Verification
```yaml
# GitHub Actions example
name: Verification Suite
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Check code coverage
        run: npm run coverage
      - name: Verify build
        run: npm run build
```

## Common Issues and Solutions

### Issue: Flaky Tests
**Solution**: 
- Add explicit waits for async operations
- Use stable test data
- Mock time-dependent operations
- Increase timeouts for CI environments

### Issue: Environment Differences
**Solution**:
- Use Docker for consistent environments
- Document all environment variables
- Version lock all dependencies
- Use feature flags for environment-specific behavior

### Issue: Test Data Pollution
**Solution**:
- Reset database between tests
- Use unique identifiers for test data
- Clean up after test completion
- Use separate test databases

## Best Practices
1. **Automate What's Repeatable**: Manual testing for exploratory, automated for regression
2. **Test at Multiple Levels**: Unit → Integration → E2E
3. **Fast Feedback**: Run quick tests frequently, comprehensive tests periodically
4. **Document Verification Steps**: Make verification reproducible
5. **Version Test Data**: Track test data changes like code
6. **Monitor in Production**: Verification doesn't stop at deployment
