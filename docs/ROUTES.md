# Routes Configuration Guide

## Overview

Tất cả các routes/trang trong ứng dụng được quản lý tập trung thông qua file `src/constants/routes.ts`. Điều này giúp:

- ✅ Dễ dàng quản lý và cập nhật routes
- ✅ Tránh typo trong URLs
- ✅ Có tổng quan đầy đủ về cấu trúc ứng dụng
- ✅ Tái sử dụng routes trong navigation, redirects, guards, etc.

## Cấu Trúc Routes

Routes được tổ chức theo nhóm chức năng:

### 1. Main Routes (`ROUTES`)

```typescript
import { ROUTES } from '@/constants';

// Home
ROUTES.HOME; // '/'

// Authentication
ROUTES.AUTH.SIGNIN; // '/auth/signin'
ROUTES.AUTH.SIGNUP; // '/auth/signup'
ROUTES.AUTH.CALLBACK; // '/auth/callback'

// Sessions
ROUTES.SESSIONS.NEW; // '/sessions/new'
ROUTES.SESSIONS.DETAIL('123'); // '/sessions/123'

// Host routes
ROUTES.HOST.DASHBOARD; // '/host/dashboard'
ROUTES.HOST.SESSIONS.LIST; // '/host/sessions'
ROUTES.HOST.SESSIONS.DETAIL('123'); // '/host/sessions/123'
ROUTES.HOST.TOURNAMENTS.NEW; // '/host/tournaments/new'
ROUTES.HOST.TOURNAMENTS.DETAIL('456'); // '/host/tournaments/456'

// Player routes
ROUTES.PLAYER.DASHBOARD; // '/player/dashboard'
ROUTES.PLAYER.SESSIONS.LIST; // '/player/sessions'
ROUTES.PLAYER.SESSIONS.DETAIL('123'); // '/player/sessions/123'
ROUTES.PLAYER.PROFILE('789'); // '/player/789'

// Browse routes
ROUTES.BROWSE.TOURNAMENTS.LIST; // '/browse/tournaments'
ROUTES.BROWSE.TOURNAMENTS.DETAIL('456'); // '/browse/tournaments/456'
ROUTES.BROWSE.SESSIONS.DETAIL('123'); // '/browse/sessions/123'

// Admin routes
ROUTES.ADMIN.USERS; // '/admin/users'
ROUTES.ADMIN.NOTIFICATIONS; // '/admin/notifications'

// Settings
ROUTES.SETTINGS; // '/settings'
ROUTES.ABOUT; // '/about'
```

### 2. Route Groups (`ROUTE_GROUPS`)

Nhóm các routes liên quan:

```typescript
import { ROUTE_GROUPS } from '@/constants';

// Protected routes (require authentication)
ROUTE_GROUPS.PROTECTED;

// Public routes
ROUTE_GROUPS.PUBLIC;

// Host-only routes
ROUTE_GROUPS.HOST_ONLY;

// Player-only routes
ROUTE_GROUPS.PLAYER_ONLY;

// Admin-only routes
ROUTE_GROUPS.ADMIN_ONLY;

// Main navigation items
ROUTE_GROUPS.MAIN_NAV;

// Session-related routes
ROUTE_GROUPS.SESSION_ROUTES;

// Tournament-related routes
ROUTE_GROUPS.TOURNAMENT_ROUTES;
```

### 3. Route Helpers (`routeHelpers`)

Các hàm helper để kiểm tra loại route:

```typescript
import { routeHelpers } from '@/constants';

// Check if route is protected
routeHelpers.isProtected('/dashboard'); // true
routeHelpers.isProtected('/about'); // false

// Check if route is public
routeHelpers.isPublic('/about'); // true
routeHelpers.isPublic('/dashboard'); // false

// Check if route is host-only
routeHelpers.isHostOnly('/host/sessions'); // true

// Check if route is player-only
routeHelpers.isPlayerOnly('/player/sessions'); // true

// Check if route is admin-only
routeHelpers.isAdminOnly('/admin/users'); // true

// Get base route
routeHelpers.getBaseRoute('/host/sessions/123'); // '/host/sessions'
```

### 4. Breadcrumb Labels (`BREADCRUMB_LABELS`)

Ánh xạ routes đến các nhãn hiển thị:

```typescript
import { BREADCRUMB_LABELS } from '@/constants';

BREADCRUMB_LABELS[ROUTES.HOME]; // 'Home'
BREADCRUMB_LABELS[ROUTES.HOST.SESSIONS.LIST]; // 'My Sessions'
```

### 5. Route Redirects (`ROUTE_REDIRECTS`)

Các redirect từ route cũ sang route mới:

```typescript
import { ROUTE_REDIRECTS } from '@/constants';

ROUTE_REDIRECTS['/my-session']; // '/guest/session'
ROUTE_REDIRECTS['/tournaments']; // '/browse/tournaments'
```

### 6. Locale Helpers

Làm việc với locale-prefixed routes:

```typescript
import { withLocale, removeLocale } from '@/constants';

// Add locale prefix
withLocale('en', ROUTES.HOME); // '/en/'

// Remove locale prefix
removeLocale('/en/dashboard'); // '/dashboard'
removeLocale('/vi/sessions/123'); // '/sessions/123'
```

## Sử Dụng Trong Ứng Dụng

### Navigation Links

```typescript
import { ROUTES } from '@/constants';
import Link from 'next/link';

export function MainNav() {
  return (
    <nav>
      <Link href={ROUTES.HOME}>Home</Link>
      <Link href={ROUTES.HOST.SESSIONS.LIST}>My Sessions</Link>
    </nav>
  );
}
```

### Route Guards

```typescript
import { routeHelpers, ROUTE_GROUPS } from '@/constants';
import { usePathname } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtected = routeHelpers.isProtected(pathname);

  if (!isProtected) {
    return <Unauthorized />;
  }

  return children;
}
```

### Breadcrumbs

```typescript
import { BREADCRUMB_LABELS, removeLocale } from '@/constants';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname();
  const cleanPath = removeLocale(pathname);
  const label = BREADCRUMB_LABELS[cleanPath];

  return <span>{label || 'Unknown'}</span>;
}
```

### Dynamic Routes

```typescript
import { ROUTES } from '@/constants';
import { useRouter } from 'next/navigation';

export function SessionCard({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(ROUTES.HOST.SESSIONS.DETAIL(sessionId));
  };

  return <button onClick={handleClick}>View Session</button>;
}
```

### Redirects (middleware.ts)

```typescript
import { ROUTE_REDIRECTS } from '@/constants';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check for route redirects
  const redirectTarget = ROUTE_REDIRECTS[pathname];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }
}
```

## Complete Routes List

### Authentication Routes

```
/auth/signin
/auth/signup
/auth/callback
```

### Session Routes

```
/sessions/new
/sessions/{id}
/host/sessions
/host/sessions/{id}
/player/sessions
/player/sessions/{id}
/player/sessions/join/confirm
/browse/sessions/{id}
/browse/sessions/{id}/join
```

### Tournament Routes

```
/host/tournaments/new
/host/tournaments/{id}
/host/tournaments/{id}/players
/host/tournaments/{id}/pairs
/host/tournaments/{id}/categories/{categoryId}

/browse/tournaments
/browse/tournaments/{id}
/browse/tournaments/{id}/matches
/browse/tournaments/{id}/players
/browse/tournaments/{id}/players/{playerId}
/browse/tournaments/{id}/events
/browse/tournaments/{id}/winners
/browse/tournaments/{id}/categories/{categoryId}
/browse/tournaments/{id}/manage
/browse/tournaments/{id}/manage/players
/browse/tournaments/{id}/manage/pairs
/browse/tournaments/{id}/manage/categories/{categoryId}
```

### Host Routes

```
/host/dashboard
/host/sessions
/host/transactions
/host/payment-settings
```

### Player Routes

```
/player/dashboard
/player/host
/player/transactions
/player/{playerId}
```

### Join Routes

```
/join
/join/register
/join/confirm
/join/status
/join-by-code
/guest/session
/guest/join/status
```

### Admin Routes

```
/admin/users
/admin/notifications
```

### Other Routes

```
/dashboard
/settings
/player-status
/about
```

## Adding New Routes

Khi thêm route mới, hãy:

1. **Thêm vào `ROUTES` object** theo group tương ứng
2. **Cập nhật `ROUTE_GROUPS`** nếu cần (thêm vào groups liên quan)
3. **Thêm breadcrumb label** vào `BREADCRUMB_LABELS`
4. **Update documentation** trong file này

Ví dụ:

```typescript
// src/constants/routes.ts

export const ROUTES = {
  // ... existing routes
  PLAYER: {
    // ... existing
    SAVED_SESSIONS: '/player/saved-sessions', // NEW
  },
};

export const ROUTE_GROUPS = {
  // ... existing groups
  SESSION_ROUTES: [
    // ... existing
    ROUTES.PLAYER.SAVED_SESSIONS, // ADD HERE
  ],
};

export const BREADCRUMB_LABELS = {
  // ... existing labels
  [ROUTES.PLAYER.SAVED_SESSIONS]: 'Saved Sessions', // ADD HERE
};
```

## Tips & Best Practices

✅ **DO:**

- Sử dụng `ROUTES` constants thay vì hardcode URLs
- Tận dụng `routeHelpers` để kiểm tra loại route
- Giữ breadcrumb labels cập nhật
- Sử dụng `ROUTE_GROUPS` cho conditional rendering

❌ **DON'T:**

- Hardcode URLs trong components
- Sử dụng string literals cho routes
- Quên update breadcrumbs khi thêm route mới
- Tạo route constants trong components

## See Also

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Route Organization Guide](./components/README.md)
