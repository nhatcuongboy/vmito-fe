# Routes Configuration - Complete Summary

## 📋 Project Overview

**Application:** Badminton Frontend Management System
**Framework:** Next.js 13+ (App Router)
**Localization:** next-intl (Vietnamese, English, Chinese)
**Routes Management:** Centralized in `src/constants/routes.ts`

---

## 📁 File Structure

```
badminton-frontend/
├── src/
│   └── constants/
│       ├── routes.ts                 # Main routes configuration
│       └── index.ts                  # Export routes to constants
├── docs/
│   ├── ROUTES.md                     # Detailed usage guide
│   ├── ROUTES_INVENTORY.json        # Complete routes inventory
│   ├── ROUTES_EXAMPLES.tsx          # 14+ usage examples
│   └── ROUTES_SUMMARY.md            # This file
```

---

## 🎯 What Was Created

### 1. **`src/constants/routes.ts`** (Main Configuration File)

Complete routes management with:

- **ROUTES object**: All application routes organized by feature
- **ROUTE_GROUPS**: Grouped routes for access control and navigation
- **routeHelpers**: Utility functions for route checking
- **BREADCRUMB_LABELS**: Route to display name mapping
- **ROUTE_REDIRECTS**: Legacy route redirects
- **Locale helpers**: withLocale(), removeLocale()

**Total Routes:** 50 pages + dynamic routes

---

## 📊 Statistics

### Routes Distribution

- **Total Pages:** 50
- **Protected Pages:** 21
- **Public Pages:** 29
- **Dynamic Routes:** 4 (locale, id, playerId, categoryId)
- **Nesting Levels:** Up to 5 levels deep

### By Category

| Category       | Count |
| -------------- | ----- |
| Authentication | 3     |
| Sessions       | 9     |
| Tournaments    | 18    |
| Host Routes    | 3     |
| Player Routes  | 4     |
| Join Routes    | 5     |
| Guest Routes   | 2     |
| Admin Routes   | 2     |
| Other          | 3     |

### By Access Level

| Type                      | Count |
| ------------------------- | ----- |
| Protected (Auth required) | 21    |
| Public                    | 29    |
| Host-only                 | 8     |
| Player-only               | 7     |
| Admin-only                | 2     |

---

## 🔑 Key Features

### ✅ Centralized Route Management

All routes defined in one place, making it easy to:

- Find all available routes
- Ensure naming consistency
- Update routes globally

### ✅ Type-Safe Route References

```typescript
import { ROUTES } from '@/constants';

// Autocomplete support
ROUTES.HOST.SESSIONS.DETAIL('123'); // ✓ Type-safe
```

### ✅ Route Grouping

Organize routes by access level for easy conditional rendering:

```typescript
ROUTE_GROUPS.PROTECTED;
ROUTE_GROUPS.PUBLIC;
ROUTE_GROUPS.HOST_ONLY;
ROUTE_GROUPS.PLAYER_ONLY;
```

### ✅ Helper Functions

```typescript
routeHelpers.isProtected(pathname);
routeHelpers.isHostOnly(pathname);
routeHelpers.isPlayerOnly(pathname);
routeHelpers.getBaseRoute(pathname);
```

### ✅ Dynamic Route Support

Functions for parameterized routes:

```typescript
ROUTES.HOST.SESSIONS.DETAIL(sessionId); // ✓
ROUTES.PLAYER.PROFILE(playerId); // ✓
ROUTES.BROWSE.TOURNAMENTS.DETAIL(id); // ✓
```

### ✅ Breadcrumb Integration

```typescript
BREADCRUMB_LABELS[ROUTES.HOME]; // 'Home'
BREADCRUMB_LABELS[ROUTES.HOST.SESSIONS.LIST]; // 'My Sessions'
```

---

## 🚀 Usage Examples

### Basic Navigation Link

```typescript
import { ROUTES } from '@/constants';
import Link from 'next/link';

<Link href={ROUTES.HOST.SESSIONS.LIST}>My Sessions</Link>
```

### Dynamic Route

```typescript
const sessionId = '123';
<Link href={ROUTES.HOST.SESSIONS.DETAIL(sessionId)}>
  View Session
</Link>
```

### Route Guards

```typescript
import { routeHelpers } from '@/constants';

if (routeHelpers.isProtected(pathname)) {
  // Require authentication
}
```

### Conditional Navigation

```typescript
import { ROUTE_GROUPS } from '@/constants';

const userRoutes =
  userRole === 'host' ? ROUTE_GROUPS.HOST_ONLY : ROUTE_GROUPS.PLAYER_ONLY;
```

### Breadcrumbs

```typescript
import { BREADCRUMB_LABELS, removeLocale } from '@/constants';

const label = BREADCRUMB_LABELS[removeLocale(pathname)];
```

---

## 📚 Complete Routes List

### Root & Auth

```
GET  /                      (Home)
GET  /auth/signin           (Sign In)
GET  /auth/signup           (Sign Up)
GET  /auth/callback         (OAuth Callback)
```

### Sessions

```
POST /sessions/new          (Create Session)
GET  /sessions/:id          (View Session)
GET  /host/sessions         (List Host Sessions)
GET  /host/sessions/:id     (Manage Session)
GET  /player/sessions       (List Player Sessions)
GET  /player/sessions/:id   (View Session)
GET  /browse/sessions/:id   (Browse Session)
GET  /browse/sessions/:id/join (Join Session)
```

### Tournaments (Host)

```
POST /host/tournaments/new                  (Create)
GET  /host/tournaments/:id                  (Manage)
GET  /host/tournaments/:id/players          (Players)
GET  /host/tournaments/:id/pairs            (Pairs)
GET  /host/tournaments/:id/categories/:cid  (Category)
```

### Tournaments (Browse/Public)

```
GET  /browse/tournaments                           (List)
GET  /browse/tournaments/:id                       (Overview)
GET  /browse/tournaments/:id/matches              (Matches)
GET  /browse/tournaments/:id/players              (Players)
GET  /browse/tournaments/:id/players/:playerId    (Player Details)
GET  /browse/tournaments/:id/events               (Events)
GET  /browse/tournaments/:id/winners              (Winners)
GET  /browse/tournaments/:id/categories/:cid     (Category)
GET  /browse/tournaments/:id/manage               (Manage Hub)
GET  /browse/tournaments/:id/manage/players      (Manage Players)
GET  /browse/tournaments/:id/manage/pairs        (Manage Pairs)
GET  /browse/tournaments/:id/manage/categories/:cid (Manage Category)
```

### Host Management

```
GET  /host/dashboard                (Dashboard)
GET  /host/transactions             (Transactions)
GET  /host/payment-settings         (Payment Settings)
```

### Player Management

```
GET  /player/dashboard              (Dashboard)
GET  /player/host                   (Become Host)
GET  /player/transactions           (Transactions)
GET  /player/:playerId              (Profile)
```

### Join Flow

```
GET  /join                          (Entry)
GET  /join/register                 (Register)
GET  /join/confirm                  (Confirm)
GET  /join/status                   (Status)
GET  /join-by-code                  (Join by Code)
GET  /guest/session                 (Guest View)
GET  /guest/join/status             (Guest Status)
```

### Admin

```
GET  /admin/users                   (Users Management)
GET  /admin/notifications           (Notifications)
```

### Other

```
GET  /dashboard                     (Dashboard)
GET  /settings                      (Settings)
GET  /player-status                 (Player Status)
GET  /about                         (About)
```

---

## 🔄 Route Redirects (Legacy Support)

Old routes automatically redirect to new ones:

```typescript
/my-session          → /guest/session
/join/confirm        → /player/sessions/join/confirm
/join/status         → /guest/join/status
/sessions/find       → /browse/tournaments
/tournaments         → /browse/tournaments
/tournaments/new     → /host/tournaments/new
```

---

## 🌍 Locale Support

All routes are automatically prefixed with locale:

```
/{locale}/path

Examples:
/vi/                      (Vietnamese home)
/en/dashboard             (English dashboard)
/cn/browse/tournaments    (Chinese tournaments)
```

**Supported Locales:**

- `vi` - Vietnamese
- `en` - English
- `cn` - Chinese

---

## 📖 Documentation Files

### 1. **ROUTES.md**

Complete usage guide with:

- Detailed examples for each section
- How to use routeHelpers
- Breadcrumb integration
- Adding new routes guide
- Best practices and tips

### 2. **ROUTES_INVENTORY.json**

Comprehensive JSON inventory containing:

- All routes with metadata
- Statistics and categorization
- Dynamic segments information
- Route redirects
- Export constants list

### 3. **ROUTES_EXAMPLES.tsx**

14+ practical examples showing:

- Navigation links
- Dynamic routes
- Session/tournament cards
- Route guards
- Role-based access control
- Breadcrumbs
- Conditional menus
- Form redirects
- Locale-aware routing
- Access control lists
- Sidebar navigation
- Tab navigation

---

## ✅ Best Practices

### DO ✓

- Use `ROUTES` constants instead of hardcoding URLs
- Leverage `routeHelpers` for route checks
- Keep breadcrumb labels updated
- Use `ROUTE_GROUPS` for conditional rendering
- Import from `@/constants` for type safety

### DON'T ✗

- Hardcode route strings in components
- Create route constants in individual files
- Forget to update breadcrumbs when adding routes
- Duplicate route definitions

---

## 🛠️ Adding New Routes

When adding a new route:

1. **Add to ROUTES object** in `src/constants/routes.ts`

   ```typescript
   PLAYER: {
     // ... existing
     SAVED_SESSIONS: '/player/saved-sessions',
   }
   ```

2. **Add to relevant ROUTE_GROUPS** if needed

   ```typescript
   SESSION_ROUTES: [
     // ... existing
     ROUTES.PLAYER.SAVED_SESSIONS,
   ];
   ```

3. **Add breadcrumb label**

   ```typescript
   BREADCRUMB_LABELS: {
     // ... existing
     [ROUTES.PLAYER.SAVED_SESSIONS]: 'Saved Sessions',
   }
   ```

4. **Update documentation** in ROUTES.md

---

## 🔧 Integration Points

### Middleware (Route Redirects)

```typescript
import { ROUTE_REDIRECTS } from '@/constants';

const redirectTarget = ROUTE_REDIRECTS[pathname];
```

### Navigation Components

```typescript
import { ROUTES, ROUTE_GROUPS } from '@/constants';

// Use for links and conditional menus
```

### Route Guards

```typescript
import { routeHelpers } from '@/constants';

if (routeHelpers.isProtected(pathname)) {
  /* ... */
}
```

### Access Control

```typescript
import { ROUTE_GROUPS } from '@/constants';

const allowed = ROUTE_GROUPS.HOST_ONLY;
```

---

## 📞 Quick Reference

### Import Routes

```typescript
import { ROUTES } from '@/constants';
```

### Import Helpers

```typescript
import { routeHelpers, ROUTE_GROUPS } from '@/constants';
```

### Import Breadcrumbs

```typescript
import { BREADCRUMB_LABELS } from '@/constants';
```

### Import Redirects

```typescript
import { ROUTE_REDIRECTS } from '@/constants';
```

### Import Locale Helpers

```typescript
import { withLocale, removeLocale } from '@/constants';
```

---

## 🎓 Learning Resources

1. **Start here:** [ROUTES.md](./ROUTES.md) - Complete guide
2. **See examples:** [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) - 14+ examples
3. **Reference:** [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json) - JSON inventory
4. **Code:** [src/constants/routes.ts](../src/constants/routes.ts) - Source

---

## 📈 Architecture Benefits

### 🔍 **Visibility**

- Single source of truth for all routes
- Easy to see complete application structure
- Clear separation of concerns

### 🔐 **Type Safety**

- TypeScript autocomplete support
- No typos in route strings
- IDE hints and documentation

### 🚀 **Maintainability**

- Easy to update routes globally
- Clear naming conventions
- Organized by feature and access level

### 🎯 **Scalability**

- Simple to add new routes
- Easy to manage route groups
- Supports complex nested routes

### ♿ **Accessibility**

- Breadcrumb integration
- Role-based navigation
- Clear route organization

---

## 🐛 Troubleshooting

### Route Not Found?

1. Check `ROUTES` object in `routes.ts`
2. Verify spelling and nesting level
3. Check ROUTES_INVENTORY.json for reference

### Type Errors?

1. Ensure importing from `@/constants`
2. Check function signatures for required parameters
3. Look at ROUTES_EXAMPLES.tsx for correct usage

### Locale Issues?

1. Use `withLocale()` to add locale prefix
2. Use `removeLocale()` to remove prefix
3. Always check `next-intl` middleware configuration

---

## 📝 Version History

- **v1.0** - Initial routes configuration
  - 50 pages organized into 8 main sections
  - Complete route grouping and helpers
  - Full documentation and examples

---

## 💡 Tips & Tricks

### Tip 1: Use Breadcrumbs

Always show breadcrumbs to help users navigate:

```typescript
<Breadcrumbs label={BREADCRUMB_LABELS[currentRoute]} />
```

### Tip 2: Leverage Route Groups

Reduce complex conditional logic:

```typescript
if (ROUTE_GROUPS.PROTECTED.includes(route)) {
  /* ... */
}
```

### Tip 3: Cache Route Helpers

For performance-critical components:

```typescript
const memoizedIsProtected = useMemo(
  () => routeHelpers.isProtected(pathname),
  [pathname]
);
```

### Tip 4: Use Dynamic Routes

For SEO and clean URLs:

```typescript
// Instead of: /sessions?id=123
// Use: /sessions/123
ROUTES.SESSIONS.DETAIL(id);
```

### Tip 5: Keep Redirects Updated

Always add to ROUTE_REDIRECTS for breaking changes:

```typescript
ROUTE_REDIRECTS['/old/path'] = ROUTES.NEW.PATH;
```

---

**Last Updated:** 2026-02-03
**Framework:** Next.js 13+ (App Router)
**Status:** ✅ Production Ready
