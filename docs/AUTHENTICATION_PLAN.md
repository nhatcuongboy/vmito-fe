# Authentication System

**Last Updated**: January 22, 2026  
**Status**: ✅ Implemented  
**Backend**: NestJS with JWT + Google OAuth

---

## Overview

Authentication is handled by the NestJS backend with JWT tokens.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │  HTTP   │   Backend    │  Prisma │   Database   │
│   (Next.js)  │ ──────> │   (NestJS)   │ ──────> │ (PostgreSQL) │
└──────────────┘         └──────────────┘         └──────────────┘
      │                         │
      └── JWT Token ────────────┘
```

---

## Auth Endpoints (Backend)

| Endpoint                | Method | Auth   | Description           |
| ----------------------- | ------ | ------ | --------------------- |
| `/auth/register`        | POST   | Public | Create new user       |
| `/auth/login`           | POST   | Public | Login, returns JWT    |
| `/auth/token`           | GET    | 🔒     | Refresh token         |
| `/auth/change-password` | PUT    | 🔒     | Change password       |
| `/auth/reset-password`  | PUT    | Public | Reset password        |
| `/auth/google`          | GET    | Public | Start Google OAuth    |
| `/auth/google/callback` | GET    | Public | Google OAuth callback |

---

## Login Flow

### Email/Password Login

```
1. User submits email/password
2. Frontend calls POST /auth/login
3. Backend validates credentials (bcrypt)
4. Returns { accessToken, user }
5. Frontend stores token in Zustand store
6. Token auto-attached to subsequent requests
```

### Google OAuth Login

```
1. User clicks "Sign in with Google"
2. Frontend redirects to GET /auth/google
3. Backend redirects to Google consent
4. User authorizes
5. Google callback → Backend creates/finds user
6. Backend generates JWT
7. Redirects to frontend with token in URL
8. Frontend extracts token, stores in auth store
```

---

## Frontend Implementation

### Auth Store (`src/stores/useAuthStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}
```

### Auth Service (`src/lib/api/auth.service.ts`)

```typescript
AuthService.login({ email, password }); // Returns JWT + user
AuthService.register({ email, password, name });
AuthService.logout(); // Clears local state
AuthService.refreshToken(); // Get new token
```

### API Interceptor (`src/lib/api/base.ts`)

- Automatically attaches `Authorization: Bearer <token>` to requests
- Handles 401 errors → Clears auth, redirects to login
- Shows toast for other errors

---

## Route Guards

### ProtectedRouteGuard

```tsx
<ProtectedRouteGuard requiredRole={['HOST', 'ADMIN']}>
  <HostDashboard />
</ProtectedRouteGuard>
```

- Checks `isAuthenticated` from auth store
- Redirects to `/auth/signin` if not authenticated
- Validates user role if `requiredRole` specified

### PublicRouteGuard

```tsx
<PublicRouteGuard>
  <SignInPage />
</PublicRouteGuard>
```

- Redirects authenticated users away from auth pages
- HOST/ADMIN → `/host/dashboard`
- PLAYER → `/player/dashboard`
- GUEST → `/guest/session`

---

## User Roles

| Role     | Permissions                          |
| -------- | ------------------------------------ |
| `ADMIN`  | Full system access                   |
| `HOST`   | Create/manage sessions & tournaments |
| `PLAYER` | Join sessions, view own data         |

---

## Guest Player Flow (No Account)

```
1. Guest enters join code or scans QR
2. POST /players/join-by-code
3. Backend creates Player record (isGuest: true)
4. Returns player info + guest token
5. Guest can view status via GET /players/status?token=xxx
```

---

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`.env`)

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FRONTEND_URL=http://localhost:3000
```

---

## Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String?   // Null for OAuth users
  role          Role      @default(PLAYER)
  image         String?   // Avatar from Google
  // ... relations
}

enum Role {
  HOST
  PLAYER
  ADMIN
}
```

---

## Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiry**: 7 days by default
- **CORS**: Configured for frontend origin only
- **Token Storage**: Zustand with localStorage persistence
