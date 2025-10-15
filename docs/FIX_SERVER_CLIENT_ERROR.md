# ✅ Fix: Server/Client Function Error

## 🚨 Error encountered:

```
Error creating session: Error: Attempted to call generateCourtName() from the server but generateCourtName is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
```

## 🔍 Root cause:

- Function `generateCourtName` is defined in a file with `"use client"` directive
- But it's being called from server-side API routes
- Next.js doesn't allow calling client functions from server

## 🛠️ Solution:

1. **Create centralized utilities file**: `src/utils/session-helpers.ts`
   - No `"use client"` directive
   - Contains functions that can be used on both server and client-side

2. **Keep client-side file**: `src/lib/api/sessions.ts`
   - Has `"use client"` directive
   - Re-exports functions from utils with client-side customizations

3. **Update imports**:
   - API routes use: `@/utils/session-helpers`
   - Client components use: `@/lib/api/sessions`

## 📁 File structure after fix:

### Utils: `src/utils/session-helpers.ts`

```typescript
// NO "use client" directive
export function generateCourtName(courtNumber: number): string { ... }
export function getCourtDisplayName(...): string { ... }
export function mapSessionStatus(...): string { ... }
export function formatDate(...): string { ... }
export function formatTime(...): string { ... }
export function formatDuration(...): string { ... }
```

### Client-side: `src/lib/api/sessions.ts`

```typescript
"use client";
export function getCourtDisplayName(...): string { ... }
export function mapSessionStatus(...): string { ... }
export function formatDate(...): string { ... }
export function formatTime(...): string { ... }
export function formatDuration(...): string { ... }
```

## 🔧 Updated files:

### API Routes (Server-side):

- `src/app/api/sessions/route.ts`
- `src/app/api/sessions/[id]/route.ts`

### Client Components:

- `src/components/session/SessionDetailContent.tsx`
- `src/app/join/status/page.tsx`

## ✅ Results:

- ✅ Server/client function error has been fixed
- ✅ API routes work normally
- ✅ Client components can still use utility functions
- ✅ Court names auto-generated: "Court A", "Court B", "Court C"...
- ✅ Session created successfully with court names

## 🎯 Successful tests:

- Create new session: ✅
- Display court names: ✅
- BadmintonCourt component: ✅
- Host and Player UI: ✅

---

_Fixed: July 4, 2025_
_Issue: Server/Client function separation in Next.js_
