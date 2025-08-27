# NestJS Patterns

## Problem Statement
Common challenges when building NestJS applications:
- Module organization and dependency injection
- Authentication flow with external providers (Supabase, Auth0)
- DTO validation and transformation
- Testing strategies (unit vs integration)
- Environment configuration
- Error handling and logging

## Module Structure Pattern

### 1. Feature Module Organization
```typescript
// apps/api/src/user-profile/user-profile.module.ts
import { Module } from '@nestjs/common';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService], // Export if needed by other modules
})
export class UserProfileModule {}
```

### 2. App Module Composition
```typescript
// apps/api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserProfileModule } from '../user-profile/user-profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    UserProfileModule,
  ],
})
export class AppModule {}
```

## Authentication Pattern

### 1. JWT Strategy with Supabase
```typescript
// apps/api/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        // Delegate validation to Supabase
        const { data: { user }, error } = await this.supabaseService
          .getClient()
          .auth.getUser(rawJwtToken);
        
        if (error || !user) {
          return done(new UnauthorizedException(), false);
        }
        
        return done(null, process.env.SUPABASE_JWT_SECRET);
      },
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // Extract user from Supabase validation
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const { data: { user } } = await this.supabaseService
      .getClient()
      .auth.getUser(token);
    
    return { id: user?.id, email: user?.email };
  }
}
```

### 2. Auth Guard Usage
```typescript
// apps/api/src/user-profile/user-profile.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/decorators/user.decorator';

@Controller('user-profile')
@UseGuards(AuthGuard('jwt'))
export class UserProfileController {
  @Get('me')
  async getProfile(@User() user: any) {
    return this.userProfileService.findOne(user.id);
  }
}
```

## DTO Validation Pattern

### 1. Class Validator DTOs
```typescript
// apps/api/src/auth/dto/auth.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### 2. Global Validation Pipe
```typescript
// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });
  
  await app.listen(3000);
}
```

## Testing Patterns

### 1. Unit Testing with Mocks
```typescript
// apps/api/src/user-profile/user-profile.service.spec.ts
describe('UserProfileService', () => {
  let service: UserProfileService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should find user by id', async () => {
    const mockUser = { id: '123', email: 'test@test.com' };
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

    const result = await service.findOne('123');
    expect(result).toEqual(mockUser);
  });
});
```

### 2. Integration Testing with Supertest
```typescript
// apps/api/src/user-profile/user-profile.controller.spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('UserProfileController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/user-profile/me (GET)', () => {
    return request(app.getHttpServer())
      .get('/user-profile/me')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Environment Configuration

### 1. Config Module Setup
```typescript
// apps/api/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
});
```

### 2. Environment Files
```bash
# apps/api/.env.serve.local
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_JWT_SECRET="your-jwt-secret"
PRISMA_QUERY_ENGINE_LIBRARY="./node_modules/prisma/libquery_engine-linux-arm64-openssl-3.0.x.so.node"
```

## Prisma Integration

### 1. Prisma Service
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 2. Prisma Module
```typescript
// apps/api/src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

## Error Handling

### 1. Global Exception Filter
```typescript
// apps/api/src/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}
```

## Common Gotchas

### 1. Circular Dependencies
**Issue**: Modules depend on each other
**Fix**:
1. Restructure module - isolate, extract and inject common part
2. Only if 1 is hard then and inUse `forwardRef()` 

### 2. Request Scoped Providers
**Issue**: Performance impact with request-scoped providers
**Fix**: Use singleton scope when possible

### 3. Testing Database Connection
**Issue**: Tests fail due to database connection
**Fix**: When necessary (e.g. unit tests) mock PrismaService

### 4. CORS Issues
**Issue**: Frontend can't connect to API
**Fix**: Configure CORS properly in main.ts

## References
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- Related: [supabase-patterns.md](./supabase-patterns.md)
