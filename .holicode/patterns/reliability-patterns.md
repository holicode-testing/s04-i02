# Reliability Patterns for HoliCode

## Error Handling Patterns

### Global Error Handler Setup
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      originalError: err.message,
      stack: err.stack 
    })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Graceful Degradation Strategies
```typescript
// src/services/CacheService.ts
class CacheService {
  private redis: RedisClient | null = null;
  
  async get(key: string): Promise<string | null> {
    try {
      if (!this.redis) {
        console.warn('Cache unavailable, falling back to database');
        return null;
      }
      return await this.redis.get(key);
    } catch (error) {
      console.error('Cache error, continuing without cache:', error);
      return null; // Graceful degradation
    }
  }
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (!this.redis) return; // Silent failure for non-critical operation
      await this.redis.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
      // Continue without throwing
    }
  }
}
```

### Circuit Breaker Pattern
```typescript
// src/utils/circuitBreaker.ts
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  
  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly successThreshold = 2
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    }
  }
  
  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() >= this.timeout
    );
  }
}

// Usage
const apiBreaker = new CircuitBreaker(5, 60000, 2);

async function callExternalAPI() {
  return apiBreaker.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) throw new Error('API error');
    return response.json();
  });
}
```

## Retry Patterns

### Exponential Backoff Implementation
```typescript
// src/utils/retry.ts
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt - 1),
        maxDelay
      );
      
      const actualDelay = jitter
        ? delay * (0.5 + Math.random() * 0.5)
        : delay;
      
      console.log(`Attempt ${attempt} failed, retrying in ${actualDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }
  
  throw lastError!;
}

// Usage
const data = await withRetry(
  () => fetchDataFromAPI(),
  { maxAttempts: 5, initialDelay: 500 }
);
```

### Idempotency Considerations
```typescript
// src/middleware/idempotency.ts
import crypto from 'crypto';

class IdempotencyService {
  private cache = new Map<string, any>();
  
  async processRequest(
    idempotencyKey: string,
    fn: () => Promise<any>
  ): Promise<any> {
    // Check if we've seen this request before
    const cached = this.cache.get(idempotencyKey);
    if (cached) {
      console.log(`Returning cached result for key: ${idempotencyKey}`);
      return cached;
    }
    
    // Process the request
    const result = await fn();
    
    // Cache the result
    this.cache.set(idempotencyKey, result);
    
    // Clean up old entries (simple TTL)
    setTimeout(() => {
      this.cache.delete(idempotencyKey);
    }, 3600000); // 1 hour
    
    return result;
  }
  
  generateKey(req: Request): string {
    const content = JSON.stringify({
      method: req.method,
      path: req.path,
      body: req.body,
      userId: (req as any).user?.id
    });
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}

// Middleware
export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (idempotencyKey && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    (req as any).idempotencyKey = idempotencyKey;
  }
  
  next();
};
```

## Health Check Patterns

### Comprehensive Health Checks
```typescript
// src/health/healthCheck.ts
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
    };
  };
}

class HealthCheckService {
  async checkDatabase(): Promise<boolean> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return responseTime < 1000; // Warn if slow
    } catch {
      return false;
    }
  }
  
  async checkRedis(): Promise<boolean> {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      return responseTime < 100;
    } catch {
      return false;
    }
  }
  
  async checkExternalAPI(): Promise<boolean> {
    try {
      const response = await fetch('https://api.example.com/health', {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    
    // Database check
    const dbHealthy = await this.checkDatabase();
    checks.database = {
      status: dbHealthy ? 'pass' : 'fail',
      message: dbHealthy ? 'Database responsive' : 'Database connection failed'
    };
    
    // Redis check (non-critical)
    const redisHealthy = await this.checkRedis();
    checks.redis = {
      status: redisHealthy ? 'pass' : 'warn',
      message: redisHealthy ? 'Cache responsive' : 'Cache unavailable (degraded mode)'
    };
    
    // External API check
    const apiHealthy = await this.checkExternalAPI();
    checks.externalAPI = {
      status: apiHealthy ? 'pass' : 'warn',
      message: apiHealthy ? 'External API responsive' : 'External API unavailable'
    };
    
    // Determine overall status
    const hasFailure = Object.values(checks).some(c => c.status === 'fail');
    const hasWarning = Object.values(checks).some(c => c.status === 'warn');
    
    const status = hasFailure 
      ? 'unhealthy' 
      : hasWarning 
        ? 'degraded' 
        : 'healthy';
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
  }
}

// Endpoints
app.get('/health', async (req, res) => {
  const health = await healthCheckService.performHealthCheck();
  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(health);
});

// Separate liveness check (for Kubernetes)
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness check (for Kubernetes)
app.get('/health/ready', async (req, res) => {
  const dbHealthy = await healthCheckService.checkDatabase();
  res.status(dbHealthy ? 200 : 503).json({ 
    ready: dbHealthy 
  });
});
```

## Logging Patterns

### Structured Logging Setup
```typescript
// src/utils/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'api',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id
    });
  });
  
  next();
};
```

### Log Levels and When to Use
```typescript
// Log level guidelines
logger.error('Database connection failed', { 
  error: err.message,
  stack: err.stack
}); // System errors, unhandled exceptions

logger.warn('Rate limit approaching', { 
  userId,
  requests: requestCount 
}); // Degraded performance, approaching limits

logger.info('User login successful', { 
  userId,
  ip: req.ip 
}); // Important business events

logger.debug('Cache miss', { 
  key,
  fallback: 'database' 
}); // Detailed diagnostic information
```

### Correlation ID Tracking
```typescript
// src/middleware/correlationId.ts
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = 
    req.headers['x-correlation-id'] as string || uuidv4();
  
  (req as any).correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  // Add to logger context
  logger.defaultMeta = {
    ...logger.defaultMeta,
    correlationId
  };
  
  next();
};
```

## Timeout Configurations

```typescript
// src/config/timeouts.ts
export const TIMEOUTS = {
  DATABASE_QUERY: 30000,      // 30 seconds
  EXTERNAL_API: 10000,        // 10 seconds
  CACHE_OPERATION: 1000,      // 1 second
  FILE_UPLOAD: 300000,        // 5 minutes
  HEALTH_CHECK: 5000,         // 5 seconds
  GRACEFUL_SHUTDOWN: 30000   // 30 seconds
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  
  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, TIMEOUTS.GRACEFUL_SHUTDOWN);
  
  try {
    await server.close();
    await prisma.$disconnect();
    await redis.quit();
    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
});
