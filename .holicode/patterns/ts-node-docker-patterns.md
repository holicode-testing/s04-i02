# Docker Patterns for HoliCode (TypeScript/Node.js)

This document outlines common Docker patterns and practices specifically for TypeScript/Node.js projects within the HoliCode framework.

## Build Context Configuration

### Pattern: Efficient Build Context
**Problem**: Large build contexts slow down builds
**Solution**: Use .dockerignore and structured contexts

```dockerfile
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
coverage
dist
.vscode
```

### Pattern: Multi-Stage Builds
**Problem**: Large final images with build dependencies
**Solution**: Multi-stage build pattern

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Container Networking Patterns

### Pattern: Development Networking
**Problem**: localhost doesn't work in containers
**Solution**: Use 0.0.0.0 for binding

```typescript
// src/server.ts
const HOST = process.env.HOST || '0.0.0.0';  // Not 'localhost'
const PORT = process.env.PORT || 3000;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

### Pattern: Docker Compose Networking
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

## Volume Mount Strategies

### Pattern: Development Volume Mounts
**Problem**: Code changes require rebuild
**Solution**: Mount source code for hot reload

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    volumes:
      - ./src:/app/src  # Mount source for hot reload
      - ./package.json:/app/package.json
      - ./tsconfig.json:/app/tsconfig.json
      - /app/node_modules  # Prevent overwriting container node_modules
    command: npm run dev  # Use development command
```

### Pattern: Production Volumes
**Problem**: Persistent data and configurations
**Solution**: Named volumes for data persistence

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    volumes:
      - uploads:/app/uploads  # Persistent file uploads
      - logs:/app/logs        # Persistent logs
    
volumes:
  uploads:
    driver: local
  logs:
    driver: local
```

## Security Patterns

### Pattern: Non-Root User
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### Pattern: Secret Management
```yaml
# docker-compose.yml with secrets
version: '3.8'

services:
  api:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
