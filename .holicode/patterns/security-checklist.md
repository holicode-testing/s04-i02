# Security Checklist for HoliCode Projects

## Authentication & Authorization

### JWT Implementation
- [ ] Use strong secrets (minimum 256 bits)
- [ ] Implement token rotation
- [ ] Set appropriate expiration times
- [ ] Store refresh tokens securely
- [ ] Validate token signatures on every request

```typescript
// Example: Secure JWT configuration
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
}
```

### Role-Based Access Control (RBAC)
- [ ] Define clear role hierarchy
- [ ] Implement permission checks at API level
- [ ] Use middleware for consistent enforcement
- [ ] Audit role assignments regularly

```typescript
// Example: RBAC middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
router.delete('/users/:id', requireRole(['ADMIN']), deleteUser);
```

### Session Management
- [ ] Implement session timeout
- [ ] Regenerate session IDs after login
- [ ] Clear sessions on logout
- [ ] Implement concurrent session limits

## Data Protection

### Input Validation
- [ ] Validate all user inputs
- [ ] Use schema validation libraries (e.g., Zod, Joi)
- [ ] Sanitize HTML content
- [ ] Implement rate limiting

```typescript
// Example: Input validation with Zod
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  name: z.string().min(2).max(100),
  age: z.number().int().min(13).max(120)
});

export const validateCreateUser = (data: unknown) => {
  return createUserSchema.parse(data);
};
```

### SQL Injection Prevention
- [ ] Use parameterized queries
- [ ] Avoid string concatenation for queries
- [ ] Use ORM/query builder properly
- [ ] Validate and escape special characters

```typescript
// Example: Safe database queries with Prisma
// ✅ Safe - Parameterized
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});

// ❌ Unsafe - Never do this
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### XSS Protection
- [ ] Escape HTML output
- [ ] Set Content-Security-Policy headers
- [ ] Use httpOnly cookies
- [ ] Validate Content-Type

```typescript
// Example: Security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Secrets Management

### Environment Variables
- [ ] Never commit secrets to version control
- [ ] Use .env.example for documentation
- [ ] Validate environment variables on startup
- [ ] Use secret management services in production

```typescript
// Example: Secret validation
class ConfigService {
  constructor() {
    this.validateSecrets();
  }
  
  private validateSecrets() {
    const required = [
      'JWT_SECRET',
      'DATABASE_URL',
      'ENCRYPTION_KEY',
      'API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required secrets: ${missing.join(', ')}`);
    }
  }
}
```

## API Security

### Rate Limiting
- [ ] Implement rate limiting per endpoint
- [ ] Use sliding window algorithm
- [ ] Different limits for authenticated/unauthenticated
- [ ] Return appropriate headers

```typescript
// Example: Rate limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for sensitive endpoints
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/reset-password', strictLimiter);
```

### CORS Configuration
- [ ] Configure allowed origins explicitly
- [ ] Avoid wildcard origins in production
- [ ] Set appropriate methods and headers
- [ ] Handle preflight requests

```typescript
// Example: CORS configuration
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.example.com',
      'https://admin.example.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### API Versioning
- [ ] Version your APIs
- [ ] Maintain backward compatibility
- [ ] Document breaking changes
- [ ] Implement sunset headers

## Accepted Risks Template

When documenting accepted security risks:

```markdown
## Accepted Security Risks

### Risk: [Risk Name]
**Description**: [Detailed description of the security risk]
**Business Justification**: [Why this risk is being accepted]
**Impact Assessment**: 
- Likelihood: [Low/Medium/High]
- Impact: [Low/Medium/High]
**Mitigation Strategy**: [Partial mitigations in place, if any]
**Review Timeline**: [When this risk will be reassessed]
**Owner**: [Who is responsible for this risk]

### Example:
### Risk: Basic Authentication for Internal Admin API
**Description**: Internal admin API uses basic auth instead of OAuth2
**Business Justification**: Internal-only service with network-level protection
**Impact Assessment**:
- Likelihood: Low (internal network only)
- Impact: High (admin access)
**Mitigation Strategy**: 
- API only accessible from internal network
- Strong password requirements enforced
- Access logs monitored
**Review Timeline**: Q2 2024
**Owner**: Security Team Lead
```

## Security Audit Checklist

### Regular Review Items
- [ ] Review and rotate secrets quarterly
- [ ] Audit user permissions monthly
- [ ] Check for outdated dependencies weekly
- [ ] Review security logs daily
- [ ] Penetration testing annually
- [ ] Security training for team quarterly

### Compliance Considerations
- [ ] GDPR compliance (if handling EU data)
- [ ] CCPA compliance (if handling California resident data)
- [ ] PCI DSS (if handling payment cards)
- [ ] HIPAA (if handling health information)
- [ ] SOC 2 (for B2B SaaS)
