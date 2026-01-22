# Frontend API Integration Guide

**Last Updated**: January 22, 2026  
**Backend**: NestJS @ `http://localhost:3001`  
**Full API Reference**: See [badminton-backend/docs/API-REFERENCE.md](../../badminton-backend/docs/API-REFERENCE.md)

---

## Overview

The frontend communicates with a separate NestJS backend via REST API.

**Base Configuration** (`src/lib/api/base.ts`):
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

---

## Authentication

All protected endpoints require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

Token is stored in Zustand auth store and automatically attached via axios interceptor.

### Auth Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | Public | Register new user |
| `/auth/login` | POST | Public | Login, returns JWT |
| `/auth/token` | GET | 🔒 | Refresh token |
| `/auth/change-password` | PUT | 🔒 | Change password |
| `/auth/google` | GET | Public | Google OAuth |

### Login Flow
```typescript
// AuthService.login()
const response = await api.post('/auth/login', { email, password });
// Returns: { accessToken, tokenType, expiresIn, user }
```

---

## Core API Services

### Session Service (`src/lib/api/session.service.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getAll()` | GET `/sessions` | List user's sessions |
| `getById(id)` | GET `/sessions/:id` | Get session details |
| `create(data)` | POST `/sessions` | Create session (HOST only) |
| `update(id, data)` | PUT `/sessions/:id` | Update session |
| `delete(id)` | DELETE `/sessions/:id` | Delete session |
| `start(id)` | POST `/sessions/:id/start` | Start session |
| `end(id)` | POST `/sessions/:id/end` | End session |
| `getStatus(id)` | GET `/sessions/:id/status` | Real-time status |

### Player Service (`src/lib/api/player.service.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `checkCode(code)` | GET `/players/check-code` | Check join code |
| `joinByCode(data)` | POST `/players/join-by-code` | Guest join |
| `getStatus(token)` | GET `/players/status` | Guest status |
| `confirm(id, data)` | POST `/players/:id/confirm` | Confirm info |
| `getMySessions()` | GET `/players/me/sessions` | User's sessions |

### Court Service (`src/lib/api/court.service.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `selectPlayers(id, data)` | POST `/courts/:id/select-players` | Select players |
| `startMatch(id)` | POST `/courts/:id/start-match` | Start match |
| `endMatch(id, data)` | POST `/courts/:id/end-match` | End match |
| `getSuggestedPlayers(id)` | GET `/courts/:id/suggested-players` | AI suggestions |

---

## Enums (Frontend Types)

Keep these synced with backend (`src/lib/api/types.ts`):

```typescript
// User Roles
type Role = 'HOST' | 'PLAYER' | 'ADMIN';

// Session Status
type SessionStatus = 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';

// Player Status
type PlayerStatus = 'WAITING' | 'PLAYING' | 'FINISHED' | 'READY' | 'INACTIVE';

// Court Status
type CourtStatus = 'EMPTY' | 'IN_USE' | 'READY';

// Gender
type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

// Match Status
type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
```

---

## Environment Variables

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Production `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Error Handling

API errors are handled by axios interceptor in `base.ts`:

```typescript
// 401 Unauthorized → Clear auth, redirect to login
// Other errors → Show toast notification
```

Response format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

---

## Key Integration Points

### Auth Store (`src/stores/useAuthStore.ts`)
- Manages user session state
- Persists token in localStorage
- Auto-attached to API requests

### Protected Routes
- `ProtectedRouteGuard` - Requires authentication
- `PublicRouteGuard` - Redirects authenticated users

### Guest Flow
1. User enters join code
2. `checkCode()` → Validates code type
3. `joinByCode()` → Creates player record
4. `confirm()` → Updates player info
5. `getStatus()` → Polls for updates
