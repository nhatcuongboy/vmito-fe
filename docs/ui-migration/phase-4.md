# Phase 4: authentication flows

Completed on 2026-08-04.

## Migrated scope

- Sign in and OAuth provider entry points.
- Sign up, including phone and native gender selection.
- Forgot-password request and reset-password states.
- OAuth callback loading, error, and redirect states.
- Shared auth presentation primitives for cards, fields, alerts, loading states,
  password visibility, and submit buttons.

Validation schemas, API service calls, error mapping, auth-store updates, OAuth
query parameters, and redirects remain behaviorally unchanged. Password
visibility labels and previously missing Chinese callback messages are now
localized.

`MainLayout` and `PublicRouteGuard` remain on the legacy framework because they
are shared with routes outside auth. Migrating those application-shell
dependencies is intentionally deferred to a dedicated phase.

## Chakra boundary

- Allowlisted files before Phase 4: 522
- Allowlisted files after Phase 4: 517
- Import declarations before Phase 4: 529
- Import declarations after Phase 4: 524

Phase 4 removes five direct Chakra import declarations without adding new Chakra
usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui`
- `pnpm build`

Auth browser coverage includes all four form surfaces, all three sign-in
locales, mobile and desktop overflow checks, serious/critical Axe checks, empty
form validation, localized password visibility, missing reset token, and an
invalid OAuth callback redirect.

Lint retains existing warnings outside this phase. The production build retains
the existing `playerStatus` missing-message warning during prerendering.
