---
description: E2E Login workflow for testing pages with ProtectedRouteGuard
---

# E2E Login Workflow

This workflow describes how to perform login for E2E testing on pages protected by `ProtectedRouteGuard`.

## Test Account

| Field    | Value                     |
| -------- | ------------------------- |
| Email    | admin@example.com         |
| Password | `E2E_TEST_PASSWORD` (env) |
| Role     | ADMIN                     |

## Login Steps

1. Navigate to `http://localhost:3000/login`

2. Find and fill the email input:
   - Selector: `[data-testid="email-input"]`
   - Value: `admin@example.com`

3. Find and fill the password input:
   - Selector: `[data-testid="password-input"]`
   - Value: Check environment variable `E2E_TEST_PASSWORD`

4. Click the login button:
   - Selector: `[data-testid="login-button"]`

5. Wait for redirect to complete (URL should contain `/dashboard`)

## Verification

After successful login, verify:

- URL is `http://localhost:3000/{locale}/host/dashboard`
- Page title contains "Bảng điều khiển" or "Dashboard"
- User info is displayed in the sidebar/menu

## Notes

- The `ProtectedRouteGuard` component automatically redirects unauthenticated users to `/auth/signin`
- After login, users are redirected based on their role:
  - `ADMIN` / `HOST` → `/host/dashboard`
  - `PLAYER` → `/player/dashboard`
  - Others → `/guest/session`

## Related Files

- Login Page: `src/app/[locale]/auth/signin/page.tsx`
- Protected Guard: `src/components/guards/ProtectedRouteGuard.tsx`
- Auth Store: `src/stores/useAuthStore.ts`
