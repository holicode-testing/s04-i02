# Docker Containerization Patterns

## Overview

Comprehensive guidance for Docker containerization in monorepo environments, with focus on multi-stage builds, compose profile management, and systematic troubleshooting strategies.

## Multi-Stage Build Strategy

### Node.js Services Pattern

```dockerfile
# Multi-stage build for Node.js services
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY shared/ ./shared/
COPY src/service-name/ ./src/service-name/

RUN npm ci
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy compiled artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy runtime assets (critical for API services)
COPY src/service-name/openapi.yaml ./

EXPOSE 3002
CMD ["node", "dist/index.js"]
````

### Key Principles

1. __Builder Stage__: Compile TypeScript to JavaScript in isolated environment
2. __Production Stage__: Only runtime dependencies and compiled artifacts
3. __Runtime Assets__: Ensure all required files (openapi.yaml, configs) are copied
4. __Health Check Tools__: Install curl or equivalent for container health monitoring

## Docker Compose Profile Strategy

### Development vs Production Separation

```yaml
version: '3.8'

services:
  api-service:
    build:
      context: .
      dockerfile: src/api-service/Dockerfile
    ports:
      - "3001:3002"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    profiles:
      - prod

  api-service-dev:
    build:
      context: .
      dockerfile: src/api-service/Dockerfile.dev  # ts-node version
    ports:
      - "3001:3002"
    volumes:
      - ./src/api-service:/app/src/api-service
      - /app/node_modules  # Prevent override
    profiles:
      - dev

  user-service:
    build:
      context: .
      dockerfile: src/user-service/Dockerfile
    ports:
      - "3003:3002"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    profiles:
      - prod

  user-service-dev:
    extends: user-service
    volumes:
      - ./src/user-service:/app/src/user-service
      - /app/node_modules
    command: ["npm", "run", "dev"]  # ts-node with hot reload
    profiles:
      - dev
```

### Profile Usage

```bash
# Production mode (compiled dist)
docker-compose --profile prod up

# Development mode (live source with hot reload)
docker-compose --profile dev up

# Specific service development
docker-compose --profile dev up user-service-dev postgres-db
```

## Troubleshooting Checklist

### Critical Root Cause Analysis Order

1. __Volume Mount Conflicts__ (Most Common)

   ```bash
   # Check if bind mounts override compiled artifacts
   docker exec -it <container> ls -la /app/dist
   docker exec -it <container> cat /proc/mounts | grep /app
   ```

2. __Multi-Stage Build Verification__

   ```bash
   # Verify builder stage produces artifacts
   docker build --target builder -t temp-builder .
   docker run --rm temp-builder ls -la /app/dist

   # Verify production stage copies artifacts
   docker build --target production -t temp-prod .
   docker run --rm temp-prod ls -la /app/dist
   ```

3. __Runtime Dependencies__

   ```bash
   # Check health check tools availability
   docker exec -it <container> which curl
   docker exec -it <container> which wget

   # Verify runtime assets
   docker exec -it <container> ls -la /app/openapi.yaml
   ```

4. __Port and Health Check Alignment__

   ```bash
   # Verify service listening ports
   docker exec -it <container> netstat -tulpn
   docker exec -it <container> curl -v localhost:3002/health
   ```

### Common Error Patterns

#### "Cannot find module '/app/dist/index.js'"

__Root Cause__: Volume mount overriding compiled artifacts __Solution__:

```yaml
# PROBLEM: This wipes /app at runtime
volumes:
  - ./src/user-service:/app

# SOLUTION: Scope to development profile only
volumes:
  - ./src/user-service:/app/src/user-service
  - /app/node_modules  # Preserve installed deps
```

#### Health Check Failures

__Root Cause__: Missing curl in alpine images __Solution__:

```dockerfile
# Add to Dockerfile
RUN apk add --no-cache curl

# Or use busybox alternative
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1
```

#### Port Mismatch Errors

__Root Cause__: EXPOSE != actual service port __Solution__:

```dockerfile
# Align EXPOSE with service configuration
EXPOSE 3002  # Match your Express/Fastify port

# Or align service with Docker port
const port = process.env.PORT || 3002;
app.listen(port);
```

## Configuration Hygiene

### .dockerignore Strategy

```dockerignore
# Exclude development artifacts
node_modules
dist
*.log
.env.local

# Exclude git and IDE files
.git
.gitignore
.vscode
.idea

# Exclude test and build artifacts
coverage
.nyc_output
test-results

# Include only what's needed for build context
!src/
!shared/
!package*.json
!tsconfig*.json
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@shared/*": ["./shared/*", "src/shared/*"]
    }
  },
  "include": ["src/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Performance Optimization

### Multi-Stage Optimization

```dockerfile
# Optimize layer caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source after dependencies (better caching)
COPY . .
RUN npm run build

# Remove development dependencies in production stage
FROM node:18-alpine AS production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

### Resource Management

```yaml
# Set resource limits for stability
services:
  api-service:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## Monorepo Specific Patterns

### Shared Dependencies Strategy

```dockerfile
# Handle monorepo shared code
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig*.json ./

# Copy shared dependencies
COPY shared/ ./shared/

# Copy service-specific code
COPY src/service-name/ ./src/service-name/

RUN npm ci
RUN npm run build:service-name
```

### Workspace Management

```json
{
  "workspaces": [
    "src/*",
    "shared"
  ],
  "scripts": {
    "build:api-service": "cd src/api-service && npm run build",
    "build:user-service": "cd src/user-service && npm run build",
    "docker:build": "docker-compose build",
    "docker:dev": "docker-compose --profile dev up",
    "docker:prod": "docker-compose --profile prod up"
  }
}
```

## Debugging Commands Reference

### Container Inspection

```bash
# Runtime filesystem inspection
docker exec -it <container> find /app -name "*.js" | head -20
docker exec -it <container> ls -la /app/{dist,src,node_modules}

# Process and network debugging
docker exec -it <container> ps aux
docker exec -it <container> netstat -tulpn
docker exec -it <container> env | grep -E "(NODE|PORT|PATH)"

# Mount point analysis
docker exec -it <container> cat /proc/mounts | grep /app
docker exec -it <container> df -h /app
```

### Build-Time Debugging

```bash
# Multi-stage build inspection
docker build --target builder -t debug-builder .
docker run --rm -it debug-builder sh

# Layer analysis
docker history <image-name>
docker inspect <image-name> | jq '.[].Config'
```

### Volume Debugging

```bash
# Volume mount verification
docker-compose config
docker inspect <container> | jq '.[].Mounts'

# Data persistence verification
docker run --rm -v $(pwd):/host alpine ls -la /host
```

## Integration with HoliCode Framework

### TASK-Implement Workflow Integration

When containerization issues persist beyond the configurable pivot threshold (default: 5 failed attempts), systematically apply this troubleshooting checklist:

1. __Volume Mount Analysis__: Check compose volume configurations
2. __Multi-Stage Verification__: Validate builder vs production stages
3. __Runtime Asset Validation__: Ensure required files copied to production
4. __Port/Health Alignment__: Verify service configuration consistency

### State File Updates

```markdown
# In activeContext.md
**Current Focus**: Containerization troubleshooting using systematic Docker patterns

# In progress.md
- [ ] Docker multi-stage builds verified
- [ ] Volume mount conflicts resolved
- [ ] Health checks passing consistently
- [ ] Production/development profiles working
```

## Best Practices Summary

1. __Separate Dev/Prod Profiles__: Use compose profiles to avoid bind mount conflicts
2. __Multi-Stage Builds__: Isolate build-time vs runtime dependencies
3. __Runtime Asset Management__: Always copy required files to production stage
4. __Health Check Tooling__: Ensure diagnostic tools available in containers
5. __Port Consistency__: Align EXPOSE, service ports, and health checks
6. __Systematic Debugging__: Follow volume → build → runtime → network analysis order
7. __Configuration Hygiene__: Use .dockerignore and proper tsconfig setups
8. __Resource Optimization__: Set appropriate limits and use layer caching
