# Routes Configuration - Quick Start Guide

## 🚀 Getting Started (2 Minutes)

### What was created?

A centralized route management system for your Badminton Frontend application with:

1. **`src/constants/routes.ts`** - Main configuration file with all 50+ routes
2. **Documentation files** - Guides and examples
3. **Helper functions** - For route checking and manipulation
4. **Type-safe imports** - Autocomplete support in your IDE

---

## 📦 Import & Use

### Basic Usage

```typescript
import { ROUTES } from '@/constants';
import Link from 'next/link';

// Simple navigation
<Link href={ROUTES.HOME}>Home</Link>

// Dynamic routes
<Link href={ROUTES.HOST.SESSIONS.DETAIL(sessionId)}>View Session</Link>
```

### Route Helpers

```typescript
import { routeHelpers, ROUTE_GROUPS } from '@/constants';

// Check route type
routeHelpers.isProtected('/dashboard'); // true
routeHelpers.isHostOnly('/host/sessions'); // true
routeHelpers.isPlayerOnly('/player/sessions'); // true

// Check access
const userCan = ROUTE_GROUPS.HOST_ONLY.includes(route);
```

### Breadcrumbs

```typescript
import { BREADCRUMB_LABELS, removeLocale } from '@/constants';

const label = BREADCRUMB_LABELS[removeLocale(pathname)];
```

---

## 📂 All Route Categories

### 🏠 Main Routes

```
/ (HOME)
/dashboard
```

### 🔐 Authentication

```
/auth/signin
/auth/signup
/auth/callback
```

### 🏸 Sessions

```
/sessions/new
/sessions/:id
/host/sessions
/player/sessions
/browse/sessions/:id
```

### 🏆 Tournaments

```
/host/tournaments/new
/browse/tournaments
/browse/tournaments/:id
/browse/tournaments/:id/players
/browse/tournaments/:id/matches
... and more
```

### 👤 Host

```
/host/dashboard
/host/sessions
/host/transactions
/host/payment-settings
```

### 🎾 Player

```
/player/dashboard
/player/host
/player/sessions
/player/transactions
/player/:playerId
```

### 📝 Join Flow

```
/join
/join/register
/join/confirm
/join/status
/join-by-code
/guest/session
```

### ⚙️ Admin

```
/admin/users
/admin/notifications
```

### 📋 Other

```
/settings
/player-status
/about
```

---

## 🎯 Common Tasks

### Task 1: Create a Link

```typescript
import { ROUTES } from '@/constants';

<Link href={ROUTES.HOST.DASHBOARD}>
  Host Dashboard
</Link>
```

### Task 2: Redirect After Action

```typescript
import { ROUTES } from '@/constants';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push(ROUTES.HOST.SESSIONS.DETAIL(newSessionId));
```

### Task 3: Conditional Navigation

```typescript
import { routeHelpers } from '@/constants';

if (routeHelpers.isProtected(pathname)) {
  // Show auth-required page
}
```

### Task 4: Show Breadcrumbs

```typescript
import { BREADCRUMB_LABELS } from '@/constants';

const label = BREADCRUMB_LABELS[route];
```

### Task 5: Check User Access

```typescript
import { ROUTE_GROUPS } from '@/constants';

const canAccessHost = ROUTE_GROUPS.HOST_ONLY.includes(route);
```

---

## 📊 Key Statistics

| Metric             | Count          |
| ------------------ | -------------- |
| Total Pages        | 50             |
| Protected Routes   | 21             |
| Public Routes      | 29             |
| Host-only Routes   | 8              |
| Player-only Routes | 7              |
| Admin-only Routes  | 2              |
| Supported Locales  | 3 (vi, en, cn) |

---

## 🔑 Main Constants Exported

### ROUTES

Complete routes object with all paths:

```typescript
ROUTES.HOME;
ROUTES.AUTH.SIGNIN;
ROUTES.HOST.SESSIONS.LIST;
ROUTES.PLAYER.PROFILE(id);
// ... and 50+ more
```

### ROUTE_GROUPS

Pre-grouped routes for access control:

```typescript
ROUTE_GROUPS.PROTECTED; // Auth required
ROUTE_GROUPS.PUBLIC; // Anyone
ROUTE_GROUPS.HOST_ONLY; // Host users only
ROUTE_GROUPS.PLAYER_ONLY; // Player users only
ROUTE_GROUPS.ADMIN_ONLY; // Admin users only
```

### routeHelpers

Helper functions:

```typescript
routeHelpers.isProtected(pathname);
routeHelpers.isPublic(pathname);
routeHelpers.isHostOnly(pathname);
routeHelpers.isPlayerOnly(pathname);
routeHelpers.isAdminOnly(pathname);
routeHelpers.getBaseRoute(pathname);
```

### BREADCRUMB_LABELS

Route to label mapping:

```typescript
BREADCRUMB_LABELS[ROUTES.HOME];
BREADCRUMB_LABELS[ROUTES.HOST.SESSIONS.LIST];
// etc.
```

### ROUTE_REDIRECTS

Legacy routes mapping:

```typescript
ROUTE_REDIRECTS['/old/path'] → new route
```

### Locale Helpers

```typescript
withLocale(locale, path); // Add locale prefix
removeLocale(pathname); // Remove locale prefix
```

---

## 📚 Documentation Files

| File                                             | Purpose                            |
| ------------------------------------------------ | ---------------------------------- |
| [ROUTES.md](./ROUTES.md)                         | Complete usage guide with examples |
| [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)     | 14+ practical code examples        |
| [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json) | Complete routes inventory in JSON  |
| [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)         | Detailed architecture overview     |
| [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)   | This file                          |

---

## ⚡ Quick Tips

// ✓ Good

// ✓ Good - TypeScript will help you
import { ROUTES } from '@/constants';
const route = ROUTES.HOST.SESSIONS.DETAIL(id);

// ✗ Risky
const route = `/host/sessions/${id}`;

````

### Tip 3: Use Route Groups for Access Control

```typescript
// ✓ Good
const canAccess = ROUTE_GROUPS.HOST_ONLY.includes(route);

// ✗ More complex
const canAccess = route.startsWith('/host/');
````

### Tip 4: Always Add Breadcrumbs

````typescript
// ✓ Good
const label = BREADCRUMB_LABELS[route] || 'Unknown';


---

## 🔄 Adding New Routes

When you add a new page to your app:

1. **Add to ROUTES in `src/constants/routes.ts`**

   ```typescript
   export const ROUTES = {
     // ...
     PLAYER: {
       // ... existing
       SAVED_SESSIONS: '/player/saved-sessions', // NEW
     },
   };
````

2. **Add to ROUTE_GROUPS if needed**

   ```typescript
   SESSION_ROUTES: [
     // ... existing
     ROUTES.PLAYER.SAVED_SESSIONS,
   ];
   ```

3. **Add breadcrumb label**

   ```typescript
   [ROUTES.PLAYER.SAVED_SESSIONS]: 'Saved Sessions'
   ```

4. **Update documentation**
   - Add to relevant section in ROUTES.md
   - Add example in ROUTES_EXAMPLES.tsx

---

## 🛠️ Common Integration Points

### Middleware

```typescript
import { ROUTE_REDIRECTS } from '@/constants';

// Redirect old routes to new ones
const newRoute = ROUTE_REDIRECTS[pathname];
```

### Navigation Components

```typescript
import { ROUTES } from '@/constants';

// Use in sidebar, navbar, etc.
<NavLink href={ROUTES.HOST.DASHBOARD} />
```

### Route Guards

```typescript
import { routeHelpers } from '@/constants';

// Protect routes in middleware or components
if (!routeHelpers.isProtected(pathname)) {
  // Allow without auth
}
```

### Access Control

```typescript
import { ROUTE_GROUPS } from '@/constants';

// Check user permissions
const allowed = ROUTE_GROUPS[userRole];
```

---

## ✨ Features

✅ **Centralized Management** - All routes in one place
✅ **Type-Safe** - TypeScript autocomplete support
✅ **No Hardcoding** - Never write URLs manually again
✅ **Easy Updates** - Change routes globally in one file
✅ **Well Organized** - Routes grouped by feature and access level
✅ **Helper Functions** - Built-in utilities for common tasks
✅ **Complete Documentation** - Multiple guides and examples
✅ **Scalable** - Easy to add new routes as app grows
✅ **Locale Support** - Ready for i18n routes
✅ **Legacy Support** - Handles old route redirects

---

## 🎓 Learn More

1. **Quick Examples**: Check [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
2. **Complete Guide**: Read [ROUTES.md](./ROUTES.md)
3. **Reference**: Check [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)
4. **Architecture**: See [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)
5. **Source Code**: Review `src/constants/routes.ts`

---

## 🚦 Next Steps

1. **Start using routes** in your components:

   ```typescript
   import { ROUTES } from '@/constants';
   ```

2. **Replace hardcoded URLs** with route constants

3. **Use route helpers** for conditional rendering:

   ```typescript
   import { routeHelpers } from '@/constants';
   ```

4. **Add breadcrumbs** to pages:

   ```typescript
   import { BREADCRUMB_LABELS } from '@/constants';
   ```

5. **Explore examples** in ROUTES_EXAMPLES.tsx for advanced patterns

---

## 💬 Questions?

- **How to use routes?** → See [ROUTES.md](./ROUTES.md)
- **Need examples?** → Check [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
- **Want reference?** → Look at [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)
- **Understanding structure?** → Read [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)

---

**Happy routing! 🚀**

_Last updated: 2026-02-03_
