# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix ESLint issues
pnpm format       # Format with Prettier
pnpm i18n:check   # Validate i18n translations
pnpm i18n:sync    # Sync i18n messages
```

**Do not run build or start the app to check issues unless explicitly asked.**

## Architecture

This is **Vmito** — a badminton session management and tournament platform built with Next.js 15 App Router.

### Routing

All routes are prefixed with a `[locale]` segment (vi, en, cn). Default locale is Vietnamese (`vi`). The middleware (`middleware.ts`) handles locale detection and legacy redirects (e.g. `/my-session/[id]` → `/player/sessions/[id]`).

Main route groups:

- `/[locale]/auth/` — sign in, sign up
- `/[locale]/browse/` — public session/tournament/venue browsing
- `/[locale]/host/` — host dashboard, club/session/tournament management, payments
- `/[locale]/player/[playerId]/` — player profile, session history, ratings
- `/[locale]/admin/` — admin panel
- `/[locale]/join/` — session joining flow (register → confirm → status)

### Key Directories

- `src/app/` — Next.js App Router pages and root providers
- `src/components/` — Reusable UI components. Common components in `src/components/` must be prefixed with `App` (e.g. `AppButton`)
- `src/lib/api/` — All API services. **Always call APIs through these services, never directly.**
- `src/stores/` — Zustand global state stores
- `src/hooks/` — Custom React hooks
- `src/types/` — TypeScript interfaces and enums
- `src/utils/` — Pure utility functions (auto-assign, round-robin, standings, etc.)
- `src/contexts/` — React contexts (Socket.io, Sidebar, RatingStats)
- `src/i18n/messages/` — Translation files (vi, en, cn)
- `src/constants/` — App-wide constants and feature flags

### API Layer

`src/lib/api/base.ts` — Axios instance with JWT auth interceptors and automatic token refresh. All services in `src/lib/api/` extend this. Use the `useRouter` from `@/i18n/config` (not `next/navigation`) for locale-aware navigation.

### State Management

Zustand stores in `src/stores/`. Each store is scoped to a domain (auth, session, courts, notifications, filters). Redux DevTools is integrated for debugging.

### Real-time

WebSocket via Socket.io is provided through `SocketContext` (`src/contexts/SocketContext.tsx`) and wrapped in `providers.tsx`.

### i18n

All user-facing text must use next-intl translations — never hardcode UI strings. Use `pnpm i18n:check` to validate before committing.

## Code Conventions

### Naming

- Variables/functions: `camelCase`; boolean state vars prefixed with `is`, `has`, or `should`
- Event handlers: `handle` prefix (e.g. `handleClick`)
- Components: `PascalCase`; shared components in `src/components/` must start with `App`
- Interfaces: `I` prefix (`IClub`, `ISession`); Types: `T` prefix; Enums: `E` prefix
- Constants: `UPPER_SNAKE_CASE`

### TypeScript

- No `any` — define explicit types
- Arrow functions only
- Prefer `const`/`readonly`; use `?.` and `??`

### Styling

- Use **Chakra UI v3** (`@chakra-ui/react`) for all components
- Use **inline styles**, not CSS classes
- Tailwind CSS is available for layout utilities

### Forms

- React Hook Form + Zod for all forms
- Use `Field` from `@chakra-ui/react` for labels/errors
- Use `PasswordInput` from `@chakra-ui/react` for password fields

### Documents

- Generate any new documentation files in `/docs/` in English
