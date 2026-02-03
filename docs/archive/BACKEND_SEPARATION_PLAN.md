# Kế Hoạch Tách Backend Ra Project Riêng

## 📋 Tổng Quan

Tài liệu này phân tích khả năng và các phương án để tách phần Backend API ra khỏi frontend và chạy trên một instance/server riêng biệt.

## 🔍 Phân Tích Kiến Trúc Hiện Tại

### Cấu Trúc Hiện Tại

Dự án hiện tại là một **Next.js Full-Stack Application** với:

- **Backend API**: 80+ route handlers trong `src/app/api/`
- **Frontend**: React components và pages trong `src/app/[locale]/`
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js
- **API Client**: Axios với `baseURL: '/api'` (relative path)

### Các Thành Phần Backend Chính

1. **API Routes** (`src/app/api/`):
   - Sessions API: `/api/sessions/*`
   - Players API: `/api/players/*`
   - Courts API: `/api/courts/*`
   - Matches API: `/api/sessions/*/matches/*`
   - Tournaments API: `/api/tournaments/*`
   - Categories API: `/api/categories/*`
   - Auth API: `/api/auth/*`
   - Health API: `/api/health`

2. **Service Layer** (`src/lib/api/`):
   - Business logic được tách biệt trong các service files
   - Dễ dàng migrate sang backend riêng

3. **Database Layer**:
   - Prisma schema và migrations
   - Prisma Client được generate

4. **Utilities** (`src/utils/`):
   - Round-robin logic
   - Auto-assign logic
   - Standings calculations
   - Match result utilities

## ✅ Khả Năng Tách Backend

**CÓ THỂ** - Dự án hiện tại đã có cấu trúc khá tốt để tách backend:

- ✅ API routes đã được tách biệt
- ✅ Service layer đã tách biệt business logic
- ✅ Frontend sử dụng service layer để gọi API (không gọi trực tiếp)
- ✅ Database connection được centralized

## 🎯 Các Phương Án Tách Backend

### Phương Án 1: Next.js API Routes Trong Monorepo (Đề Xuất)

**Mô Tả**: Tách thành 2 Next.js apps trong cùng một monorepo:

- `apps/backend`: Chỉ chứa API routes
- `apps/frontend`: Chỉ chứa frontend pages và components

**Ưu Điểm**:

- ✅ Dễ migrate (ít thay đổi code)
- ✅ Vẫn sử dụng Next.js API Routes (familiar)
- ✅ Có thể share types và utilities
- ✅ Có thể deploy riêng biệt

**Nhược Điểm**:

- ❌ Vẫn phụ thuộc vào Next.js cho backend
- ❌ Deployment hơi phức tạp hơn

**Cấu Trúc Dự Kiến**:

```
badminton-app/
├── apps/
│   ├── backend/          # Next.js app chỉ với API routes
│   │   ├── src/
│   │   │   └── app/
│   │   │       └── api/  # Tất cả API routes
│   │   ├── prisma/       # Database schema
│   │   └── package.json
│   │
│   └── frontend/         # Next.js app chỉ với frontend
│       ├── src/
│       │   ├── app/
│       │   │   └── [locale]/  # Pages
│       │   └── components/    # React components
│       ├── src/lib/api/       # API client (đổi baseURL)
│       └── package.json
│
├── packages/
│   └── shared/           # Shared types, utils
│       ├── types/
│       └── utils/
│
├── pnpm-workspace.yaml
└── package.json          # Root package.json
```

---

### Phương Án 2: Standalone Express/Fastify Server

**Mô Tả**: Tạo một Node.js server độc lập với Express hoặc Fastify, chuyển toàn bộ API routes sang REST API server.

**Ưu Điểm**:

- ✅ Hoàn toàn độc lập với frontend framework
- ✅ Dễ scale backend riêng biệt
- ✅ Có thể dùng bất kỳ Node.js framework nào
- ✅ Deployment đơn giản hơn (chỉ cần Node.js server)

**Nhược Điểm**:

- ❌ Cần rewrite nhiều code (Next.js API routes → Express routes)
- ❌ Mất một số features của Next.js (middleware, edge functions)
- ❌ Cần setup CORS, authentication lại

**Tech Stack Đề Xuất**:

- **Backend**: Express.js hoặc Fastify
- **Database**: Prisma (giữ nguyên)
- **Auth**: JWT + custom auth middleware (thay NextAuth)
- **Validation**: Zod (đã có sẵn)

**Cấu Trúc Dự Kiến**:

```
badminton-app/
├── backend/              # Express/Fastify server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, CORS, etc.
│   │   └── utils/       # Utilities
│   ├── prisma/          # Database schema
│   └── package.json
│
└── frontend/            # Next.js frontend only
    ├── src/
    │   ├── app/
    │   ├── components/
    │   └── lib/api/     # API client (baseURL = backend URL)
    └── package.json
```

---

### Phương Án 3: Hybrid - Next.js Backend + Standalone Frontend

**Mô Tả**: Giữ backend ở Next.js, nhưng tách frontend ra một React/Next.js app riêng chạy ở port khác.

**Ưu Điểm**:

- ✅ Dễ migrate (ít thay đổi backend)
- ✅ Frontend có thể deploy ở CDN/static hosting
- ✅ Backend vẫn giữ được Next.js features

**Nhược Điểm**:

- ❌ Vẫn phụ thuộc Next.js cho backend
- ❌ Cần setup CORS cho API

---

## 🚀 Phương Án Đề Xuất: Monorepo với 2 Apps

Tôi đề xuất **Phương Án 1** vì:

1. Ít thay đổi code nhất
2. Vẫn giữ được Next.js API Routes (đã quen thuộc)
3. Có thể deploy riêng biệt
4. Dễ maintain và scale

## 📝 Các Thay Đổi Cần Thiết

### 1. Frontend - API Client Configuration

**File**: `src/lib/api/base.ts`

**Hiện Tại**:

```typescript
export const api = axios.create({
  baseURL: '/api', // Relative path
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Sau Khi Tách**:

```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Environment Variables Cần Thêm**:

```env
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 2. Backend - CORS Configuration

**File**: `apps/backend/src/middleware.ts` hoặc `next.config.ts`

Cần thêm CORS để frontend có thể gọi API:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }
}
```

### 3. Authentication - Cookie/JWT Sharing

**Vấn Đề**: NextAuth sử dụng cookies để quản lý session. Khi tách backend, cần đảm bảo cookies được share giữa frontend và backend.

**Giải Pháp 1**: Sử dụng JWT tokens thay vì cookies

- Frontend lưu JWT trong localStorage
- Gửi JWT trong Authorization header
- Backend validate JWT

**Giải Pháp 2**: Giữ cookies nhưng đảm bảo:

- Same domain: `api.yourdomain.com` và `app.yourdomain.com` share cookies
- Hoặc sử dụng subdomain với wildcard cookie

**File**: `src/lib/api/base.ts` (với JWT)

```typescript
api.interceptors.request.use((config) => {
  // Get token from localStorage hoặc cookies
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. Database - Shared Prisma Schema

**Option 1**: Giữ Prisma trong backend, frontend không cần database

- ✅ Đơn giản hơn
- ✅ Bảo mật hơn

**Option 2**: Share Prisma client giữa 2 apps (monorepo)

- ✅ Có thể validate types
- ❌ Frontend vẫn có quyền truy cập database types

**Khuyến Nghị**: Option 1 - Chỉ backend có Prisma

### 5. Environment Variables

**Backend `.env`**:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3001

# Port
PORT=3001

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`**:

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Auth (nếu cần)
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 Migration Steps

### Bước 1: Setup Monorepo Structure

1. Cài đặt workspace manager (pnpm workspace):

```bash
# Root package.json
{
  "name": "badminton-app-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

2. Tạo cấu trúc thư mục:

```
badminton-app/
├── apps/
│   ├── backend/
│   └── frontend/
└── packages/
    └── shared/
```

### Bước 2: Move Backend Code

1. Di chuyển API routes từ `src/app/api/` → `apps/backend/src/app/api/`
2. Di chuyển Prisma schema → `apps/backend/prisma/`
3. Di chuyển services và utils cần thiết
4. Setup `apps/backend/package.json`

### Bước 3: Move Frontend Code

1. Di chuyển pages, components → `apps/frontend/src/`
2. Update API client baseURL
3. Setup `apps/frontend/package.json`

### Bước 4: Update Dependencies

1. Backend: Chỉ cần Next.js cho API routes, Prisma, auth libraries
2. Frontend: Next.js, React, UI libraries, API client

### Bước 5: Setup CORS và Authentication

1. Cấu hình CORS trên backend
2. Cấu hình authentication flow (JWT hoặc cookies)
3. Update API client để gửi auth tokens

### Bước 6: Testing

1. Test tất cả API endpoints
2. Test authentication flow
3. Test frontend-backend communication
4. Test deployment trên 2 instances

## 📦 Deployment

### Option 1: Vercel (Easier)

**Backend**:

- Deploy `apps/backend` lên Vercel
- API URL: `https://backend-app.vercel.app`

**Frontend**:

- Deploy `apps/frontend` lên Vercel
- Set env: `NEXT_PUBLIC_API_URL=https://backend-app.vercel.app/api`

### Option 2: Separate Servers

**Backend**:

- Deploy Node.js server (Railway, Render, AWS EC2)
- Setup reverse proxy (Nginx) nếu cần
- Domain: `api.yourdomain.com`

**Frontend**:

- Deploy Next.js app (Vercel, Netlify)
- Domain: `app.yourdomain.com` hoặc `yourdomain.com`

## ⚠️ Lưu Ý Quan Trọng

1. **CORS**: Phải cấu hình đúng để frontend gọi được backend
2. **Authentication**: Cần quyết định dùng JWT hay cookies
3. **Session Management**: NextAuth cookies không hoạt động cross-domain
4. **Environment Variables**: Đảm bảo cấu hình đúng ở cả 2 apps
5. **Database Connection**: Backend cần kết nối database, frontend không cần
6. **Error Handling**: Update error handling khi API không cùng origin

## 🎯 Kết Luận

**CÓ THỂ TÁCH BACKEND** thành project riêng. Đề xuất:

- **Phương án**: Monorepo với 2 Next.js apps
- **Timeline**: 2-3 ngày để migrate và test
- **Lợi ích**:
  - Scale backend riêng biệt
  - Deploy độc lập
  - Team có thể làm việc parallel

Bạn muốn tôi bắt đầu implement phương án nào?
