# Kế hoạch Migration Backend sang NestJS

## 📋 Tổng quan

Tài liệu này mô tả chi tiết kế hoạch migration phần Backend của dự án Badminton App từ Next.js API Routes sang NestJS framework.

**Ngày tạo**: 2025-01-XX  
**Phiên bản**: 1.0  
**Trạng thái**: Planning

---

## 🎯 Mục tiêu Migration

1. **Tách biệt Backend và Frontend**: Tách backend thành một service độc lập
2. **Cải thiện kiến trúc**: Sử dụng NestJS với kiến trúc modular, dependency injection
3. **Tăng khả năng mở rộng**: Dễ dàng thêm features, testing, và maintain
4. **Chuẩn hóa API**: RESTful API với validation, error handling tốt hơn
5. **Tối ưu performance**: Có thể scale backend độc lập với frontend

---

## 📊 Phân tích Hiện trạng

### Backend hiện tại

- **Framework**: Next.js 15.3.4 với API Routes
- **Database**: Prisma ORM + PostgreSQL
- **Authentication**: NextAuth v5 (beta) với JWT
- **API Routes**: ~80+ route files trong `src/app/api/`
- **Service Layer**: Các service trong `src/lib/api/`
- **Middleware**: Next.js middleware cho routing và i18n

### Cấu trúc API hiện tại

#### 1. **Sessions Management** (15+ endpoints)

- `/api/sessions` - CRUD operations
- `/api/sessions/[id]/start`, `/end`, `/status`
- `/api/sessions/[id]/players`, `/courts`, `/matches`
- `/api/sessions/[id]/auto-assign`, `/waiting-queue`, `/wait-times`

#### 2. **Players Management** (8+ endpoints)

- `/api/players/[id]` - CRUD
- `/api/players/[id]/confirm`
- `/api/players/check-code`, `/link-account`
- `/api/sessions/[id]/players/bulk`

#### 3. **Courts Management** (8+ endpoints)

- `/api/courts/[id]` - CRUD
- `/api/courts/[id]/select-players`, `/start-match`, `/end-match`
- `/api/courts/[id]/pre-select`, `/suggested-players`

#### 4. **Matches Management** (5+ endpoints)

- `/api/sessions/[id]/matches`
- `/api/sessions/[id]/matches/[matchId]/end`
- `/api/category-matches/[id]/start`, `/end`

#### 5. **Tournaments Management** (20+ endpoints)

- `/api/tournaments` - CRUD
- `/api/tournaments/[id]/categories`, `/players`, `/pairs`, `/courts`
- `/api/categories/[id]/groups`, `/registrations`, `/matches`
- `/api/category-matches/[id]` - Match management

#### 6. **Authentication** (5 endpoints)

- `/api/auth/[...nextauth]` - NextAuth handlers
- `/api/auth/register`, `/change-password`, `/reset-password`, `/token`

#### 7. **Utilities** (5+ endpoints)

- `/api/health` - Health check
- `/api/pwa/subscribe`, `/sync` - PWA features
- `/api/update-wait-times` - Background jobs

### Dependencies hiện tại

```json
{
  "@prisma/client": "6.16.2",
  "next-auth": "5.0.0-beta.25",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "axios": "^1.10.0"
}
```

---

## 🏗️ Kiến trúc NestJS mới

### Cấu trúc thư mục đề xuất

```
badminton-backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── common/                    # Shared modules
│   │   ├── decorators/
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # Logging, transformation
│   │   ├── pipes/                 # Validation pipes
│   │   └── utils/
│   │
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   └── app.config.ts
│   │
│   ├── prisma/                    # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   │
│   ├── users/                     # Users module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── sessions/                  # Sessions module
│   │   ├── sessions.module.ts
│   │   ├── sessions.controller.ts
│   │   ├── sessions.service.ts
│   │   ├── dto/
│   │   │   ├── create-session.dto.ts
│   │   │   └── update-session.dto.ts
│   │   └── entities/
│   │       └── session.entity.ts
│   │
│   ├── players/                   # Players module
│   │   ├── players.module.ts
│   │   ├── players.controller.ts
│   │   ├── players.service.ts
│   │   └── dto/
│   │
│   ├── courts/                    # Courts module
│   │   ├── courts.module.ts
│   │   ├── courts.controller.ts
│   │   ├── courts.service.ts
│   │   └── dto/
│   │
│   ├── matches/                   # Matches module
│   │   ├── matches.module.ts
│   │   ├── matches.controller.ts
│   │   ├── matches.service.ts
│   │   └── dto/
│   │
│   ├── tournaments/               # Tournaments module
│   │   ├── tournaments.module.ts
│   │   ├── tournaments.controller.ts
│   │   ├── tournaments.service.ts
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   └── categories.service.ts
│   │   ├── groups/
│   │   │   ├── groups.module.ts
│   │   │   └── groups.service.ts
│   │   └── dto/
│   │
│   └── health/                    # Health check module
│       ├── health.module.ts
│       └── health.controller.ts
│
├── prisma/                        # Prisma schema (shared)
│   ├── schema.prisma
│   └── migrations/
│
├── test/                          # E2E tests
│   ├── app.e2e-spec.ts
│   └── ...
│
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔄 Chiến lược Migration

### Phương án 1: Big Bang Migration (Không khuyến nghị)

- Migrate toàn bộ một lúc
- Rủi ro cao, downtime lớn
- Khó test và rollback

### Phương án 2: Strangler Fig Pattern (Khuyến nghị) ⭐

- Migrate từng module một
- Giữ Next.js API routes song song
- Chuyển dần traffic sang NestJS
- Có thể rollback dễ dàng

### Phương án 3: Hybrid Approach

- Giữ Next.js cho frontend rendering
- NestJS chỉ cho API endpoints
- Proxy requests từ Next.js → NestJS

---

## 📝 Kế hoạch thực hiện chi tiết

### Phase 1: Setup & Infrastructure (Tuần 1-2)

#### 1.1. Tạo NestJS project mới

```bash
# Tạo project mới
nest new badminton-backend
cd badminton-backend

# Cài đặt dependencies
npm install @prisma/client prisma
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcryptjs class-validator class-transformer
npm install @nestjs/config
npm install @nestjs/throttler  # Rate limiting
npm install @nestjs/swagger   # API documentation
```

#### 1.2. Setup Prisma

- Copy `prisma/` folder từ project hiện tại
- Setup `PrismaService` và `PrismaModule`
- Test database connection

#### 1.3. Setup Configuration

- Environment variables management
- Database configuration
- JWT configuration
- CORS configuration

#### 1.4. Setup Common modules

- Exception filters
- Validation pipes
- Logging interceptors
- Response transformation

**Deliverables:**

- ✅ NestJS project structure
- ✅ Prisma integration
- ✅ Basic configuration
- ✅ Health check endpoint

---

### Phase 2: Authentication Module (Tuần 3-4)

#### 2.1. Migrate NextAuth → NestJS Auth

- Implement JWT strategy
- Implement Local strategy (credentials)
- Implement OAuth strategy (Google) - optional
- Create auth guards

#### 2.2. Auth Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/change-password`
- `POST /auth/reset-password`
- `POST /auth/token` (refresh token)

#### 2.3. User Management

- `GET /users` - Get users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user

**Deliverables:**

- ✅ Authentication module hoàn chỉnh
- ✅ JWT authentication working
- ✅ User CRUD operations
- ✅ Integration tests

---

### Phase 3: Sessions Module (Tuần 5-7)

#### 3.1. Core Session Operations

- `GET /sessions` - List sessions
- `POST /sessions` - Create session
- `GET /sessions/:id` - Get session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Delete session

#### 3.2. Session Lifecycle

- `POST /sessions/:id/start` - Start session
- `POST /sessions/:id/end` - End session
- `GET /sessions/:id/status` - Get status

#### 3.3. Session Relations

- `GET /sessions/:id/players` - Get players
- `GET /sessions/:id/courts` - Get courts
- `GET /sessions/:id/matches` - Get matches

**Deliverables:**

- ✅ Sessions module
- ✅ All session endpoints migrated
- ✅ Business logic preserved
- ✅ Tests passing

---

### Phase 4: Players Module (Tuần 8-9)

#### 4.1. Player CRUD

- `GET /players/:id`
- `PUT /players/:id`
- `DELETE /players/:id`
- `POST /players/:id/confirm`

#### 4.2. Session Players

- `POST /sessions/:id/players` - Add player
- `POST /sessions/:id/players/bulk` - Bulk add
- `PATCH /sessions/:id/players/:playerId`
- `DELETE /sessions/:id/players/:playerId`
- `GET /sessions/:id/players/statistics`

#### 4.3. Player Utilities

- `GET /players/check-code/:code`
- `POST /players/link-account`
- `GET /players/me/sessions`

**Deliverables:**

- ✅ Players module
- ✅ All player endpoints
- ✅ Bulk operations
- ✅ Statistics endpoint

---

### Phase 5: Courts & Matches Module (Tuần 10-11)

#### 5.1. Courts Module

- `GET /courts/:id`
- `PATCH /courts/:id`
- `POST /courts/:id/select-players`
- `POST /courts/:id/start-match`
- `POST /courts/:id/end-match`
- `GET /courts/:id/current-match`
- `POST /courts/:id/pre-select`
- `GET /courts/:id/suggested-players`

#### 5.2. Matches Module

- `GET /sessions/:id/matches`
- `POST /sessions/:id/matches/:matchId/end`
- `POST /category-matches/:id/start`
- `POST /category-matches/:id/end`

#### 5.3. Auto-assign & Queue

- `POST /sessions/:id/auto-assign`
- `GET /sessions/:id/waiting-queue`
- `PUT /sessions/:id/wait-times`
- `POST /update-wait-times`

**Deliverables:**

- ✅ Courts module
- ✅ Matches module
- ✅ Auto-assign logic
- ✅ Wait time management

---

### Phase 6: Tournaments Module (Tuần 12-15)

#### 6.1. Tournaments CRUD

- `GET /tournaments`
- `POST /tournaments`
- `GET /tournaments/:id`
- `PUT /tournaments/:id`
- `DELETE /tournaments/:id`

#### 6.2. Tournament Relations

- `GET /tournaments/:id/players`
- `POST /tournaments/:id/players`
- `GET /tournaments/:id/categories`
- `POST /tournaments/:id/categories`
- `GET /tournaments/:id/pairs`
- `GET /tournaments/:id/courts`

#### 6.3. Categories Module

- `GET /categories/:id`
- `PUT /categories/:id`
- `GET /categories/:id/registrations`
- `POST /categories/:id/registrations`
- `GET /categories/:id/standings`

#### 6.4. Groups Module

- `GET /categories/:id/groups`
- `POST /categories/:id/groups`
- `POST /categories/:id/groups/auto-assign`
- `GET /categories/:id/groups/:groupId/standings`
- `POST /categories/:id/groups/:groupId/generate-matches`

#### 6.5. Category Matches

- `GET /category-matches/:id`
- `POST /category-matches/:id/start`
- `POST /category-matches/:id/end`

**Deliverables:**

- ✅ Tournaments module hoàn chỉnh
- ✅ Categories & Groups
- ✅ Match management
- ✅ Standings calculation

---

### Phase 7: Utilities & PWA (Tuần 16)

#### 7.1. Health Check

- `GET /health` - Health check endpoint

#### 7.2. PWA Support

- `POST /pwa/subscribe` - Push notification subscription
- `POST /pwa/sync` - Offline sync

#### 7.3. Other Utilities

- `POST /join-by-code` - Join session by code
- `GET /player-status` - Get player status

**Deliverables:**

- ✅ All utility endpoints
- ✅ PWA support
- ✅ Health monitoring

---

### Phase 8: Testing & Documentation (Tuần 17-18)

#### 8.1. Unit Tests

- Test tất cả services
- Test business logic
- Coverage > 80%

#### 8.2. Integration Tests

- Test API endpoints
- Test authentication flow
- Test database operations

#### 8.3. E2E Tests

- Test critical user flows
- Test error scenarios

#### 8.4. API Documentation

- Swagger/OpenAPI documentation
- Update API docs
- Migration guide

**Deliverables:**

- ✅ Test suite hoàn chỉnh
- ✅ API documentation
- ✅ Migration guide

---

### Phase 9: Deployment & Migration (Tuần 19-20)

#### 9.1. Production Setup

- Setup production environment
- Database migration
- Environment variables
- Monitoring & logging

#### 9.2. Gradual Migration

- Deploy NestJS backend
- Update frontend to use new API
- Monitor performance
- Rollback plan ready

#### 9.3. Cleanup

- Remove old Next.js API routes
- Update documentation
- Archive old code

**Deliverables:**

- ✅ Production deployment
- ✅ Frontend migrated
- ✅ Old code removed
- ✅ Documentation updated

---

## 🔧 Technical Implementation Details

### 1. Prisma Integration

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 2. Authentication Strategy

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### 3. DTO Validation

```typescript
// sessions/dto/create-session.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Level } from '@prisma/client';

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  numberOfCourts?: number;

  @IsArray()
  @IsEnum(Level, { each: true })
  @IsOptional()
  requiredLevels?: Level[];
}
```

### 4. Exception Handling

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      success: false,
      error: exception.message,
      statusCode: status,
    });
  }
}
```

### 5. Response Transformation

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      }))
    );
  }
}
```

---

## 📦 Dependencies cần thiết

### Core Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@prisma/client": "6.16.2",
  "prisma": "6.16.2",
  "reflect-metadata": "^0.1.13",
  "rxjs": "^7.8.1"
}
```

### Authentication

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "bcryptjs": "^3.0.2"
}
```

### Validation & Transformation

```json
{
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### Configuration & Utilities

```json
{
  "@nestjs/config": "^3.0.0",
  "@nestjs/swagger": "^7.0.0",
  "@nestjs/throttler": "^5.0.0"
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- Test services với mocked dependencies
- Test business logic
- Test validation

### Integration Tests

- Test API endpoints
- Test database operations
- Test authentication flow

### E2E Tests

- Test complete user flows
- Test error scenarios
- Test performance

### Test Coverage Goals

- Services: > 90%
- Controllers: > 80%
- Overall: > 80%

---

## 🚀 Deployment Strategy

### Development

- Local development với hot reload
- Docker compose cho local testing

### Staging

- Deploy NestJS backend riêng biệt
- Test với frontend staging
- Performance testing

### Production

- Deploy NestJS backend (Vercel/Heroku/AWS)
- Update frontend API base URL
- Monitor và log
- Gradual rollout

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# App
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend.com
```

---

## ⚠️ Rủi ro và Giải pháp

### Rủi ro 1: Breaking Changes

**Mô tả**: API response format có thể thay đổi  
**Giải pháp**:

- Giữ nguyên response format hiện tại
- Sử dụng interceptors để transform
- Version API nếu cần

### Rủi ro 2: Authentication Migration

**Mô tả**: NextAuth → NestJS JWT có thể không tương thích  
**Giải pháp**:

- Implement JWT tương thích với NextAuth
- Support migration tokens
- Dual authentication trong giai đoạn transition

### Rủi ro 3: Database Schema Changes

**Mô tả**: Có thể cần thay đổi schema  
**Giải pháp**:

- Giữ nguyên Prisma schema
- Không thay đổi database structure
- Chỉ migrate application layer

### Rủi ro 4: Performance Issues

**Mô tả**: NestJS có thể chậm hơn Next.js API routes  
**Giải pháp**:

- Performance testing
- Caching strategies
- Database query optimization
- Load testing

### Rủi ro 5: Downtime

**Mô tả**: Migration có thể gây downtime  
**Giải pháp**:

- Gradual migration
- Blue-green deployment
- Rollback plan
- Feature flags

---

## ✅ Checklist Migration

### Pre-Migration

- [ ] Backup database
- [ ] Document current API endpoints
- [ ] Create test suite cho current API
- [ ] Setup NestJS project structure
- [ ] Setup CI/CD pipeline

### Phase 1: Infrastructure

- [ ] Setup NestJS project
- [ ] Integrate Prisma
- [ ] Setup configuration
- [ ] Create common modules
- [ ] Health check endpoint

### Phase 2: Authentication

- [ ] Migrate auth logic
- [ ] Implement JWT strategy
- [ ] Create auth endpoints
- [ ] Test authentication flow
- [ ] Update frontend auth calls

### Phase 3-6: Business Modules

- [ ] Migrate Sessions module
- [ ] Migrate Players module
- [ ] Migrate Courts module
- [ ] Migrate Matches module
- [ ] Migrate Tournaments module
- [ ] Test each module independently

### Phase 7: Utilities

- [ ] Migrate utility endpoints
- [ ] PWA support
- [ ] Health checks

### Phase 8: Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] API documentation

### Phase 9: Deployment

- [ ] Production deployment
- [ ] Update frontend
- [ ] Monitor performance
- [ ] Remove old code
- [ ] Update documentation

---

## 📚 Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma with NestJS](https://www.prisma.io/nestjs)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Migration Best Practices](https://martinfowler.com/articles/stranglerFigApplication.html)

---

## 📅 Timeline ước tính

| Phase                     | Duration | Start   | End     |
| ------------------------- | -------- | ------- | ------- |
| Phase 1: Infrastructure   | 2 weeks  | Week 1  | Week 2  |
| Phase 2: Authentication   | 2 weeks  | Week 3  | Week 4  |
| Phase 3: Sessions         | 3 weeks  | Week 5  | Week 7  |
| Phase 4: Players          | 2 weeks  | Week 8  | Week 9  |
| Phase 5: Courts & Matches | 2 weeks  | Week 10 | Week 11 |
| Phase 6: Tournaments      | 4 weeks  | Week 12 | Week 15 |
| Phase 7: Utilities        | 1 week   | Week 16 | Week 16 |
| Phase 8: Testing          | 2 weeks  | Week 17 | Week 18 |
| Phase 9: Deployment       | 2 weeks  | Week 19 | Week 20 |

**Tổng thời gian**: ~20 tuần (5 tháng)

---

## 🎯 Success Criteria

1. ✅ Tất cả API endpoints đã được migrate
2. ✅ Authentication hoạt động đúng
3. ✅ Test coverage > 80%
4. ✅ Performance không giảm so với hiện tại
5. ✅ Frontend hoạt động bình thường với backend mới
6. ✅ Documentation đầy đủ
7. ✅ Production deployment thành công
8. ✅ Không có breaking changes cho end users

---

## 📝 Notes

- Có thể điều chỉnh timeline dựa trên team size và priorities
- Nên bắt đầu với modules ít phức tạp để học NestJS
- Giữ communication tốt với frontend team
- Regular code reviews và testing
- Document mọi thay đổi

---

**Tác giả**: Development Team  
**Ngày cập nhật**: 2025-01-XX  
**Version**: 1.0
