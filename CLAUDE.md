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

### Data Mutations (CRUD)

- After a create/update/delete succeeds, never do a full page reload (`location.reload()`, forced remount, `router.refresh()` as a blanket fix, etc.) to reflect the change.
- Update local/Zustand state directly instead: optimistic update, or patch the API response into state, for single-item changes.
- If the mutation affects a list or several related items, refetch only the specific resource(s) affected — not the whole page.
- Needing a full reload to see fresh data is a sign the state layer is out of sync; fix that instead of reloading.

### Documents

- Generate any new documentation files in `/docs/` in English

### Debug

- The app is already running at http://localhost:3000, don't run the start command anymore, just open it and check/debug. If this port isn't running, please start it.

## File Size Guidelines

### Context: Gradual Refactoring Approach

**Current State:** The codebase contains many large files (500-1000+ lines) that need gradual refactoring. These existing files are **legacy code** and will be improved over time.

**Going Forward:** New code and modifications should follow stricter guidelines to prevent the problem from growing.

### Rules for NEW Code and Major Modifications

When **creating new files** or **substantially refactoring existing ones** (50%+ changes):

**Frontend (React/Next.js):**

- Components: 150-300 lines (max 400)
- Page components: 100-200 lines (max 300)
- Hooks: 50-150 lines (max 200)
- Utils/Helpers: 100-200 lines (max 300)
- Services: 200-300 lines (max 400)

**Key Principle:** If you're writing a new component/file from scratch, keep it under 400 lines. If you can't, it's a sign of poor design.

### Rules for EXISTING Large Files

For files that already exceed 500 lines:

**When making SMALL changes** (bug fixes, minor features):

- ✅ Make the change without refactoring the whole file
- ✅ Try to keep the new code clean and modular
- ⚠️ If adding 100+ lines to an already large file, consider extracting the new logic to a separate file instead

**When making MEDIUM changes** (new feature in existing component):

- 🎯 **Opportunistic refactoring**: If you're touching a large section, extract it to a smaller component/hook
- Extract only what you're modifying — don't refactor unrelated code
- Example: If adding a new form section to a 600-line component, extract that section to a separate component

**When making LARGE changes** (major feature, major bug fix):

- 🎯 **Mandatory refactoring**: Break down the file as part of your work
- Split by responsibility, feature, or UI section
- Aim to get the file under 500 lines if feasible

### Progressive Refactoring Strategy

**Priority Levels:**

1. **Critical** (refactor when touched): Files > 800 lines
2. **High** (refactor during medium/large changes): Files 600-800 lines
3. **Medium** (refactor opportunistically): Files 500-600 lines
4. **Low** (leave alone unless major changes): Files 400-500 lines

**When NOT to Refactor:**

- Emergency hotfixes
- Code freeze periods
- Files that rarely change and work well
- When deadline pressure is high (but plan to refactor later)

### Signs a File Needs Refactoring

- More than 500 lines
- Too many responsibilities (violates Single Responsibility Principle)
- Difficult to locate specific functions/methods
- More than 20-30 import statements
- Requires excessive scrolling to understand logic
- Multiple developers struggle to work on it simultaneously

### Refactoring Strategies

- **Extract smaller components/hooks** — break down complex components
- **Use composition patterns** — combine smaller pieces instead of monoliths
- **Separate business logic** — move logic to custom hooks or services
- **Organize by concerns/features** — group related functionality
- **Create sub-components in same directory** — e.g., `SessionForm/`, `SessionForm/index.tsx`, `SessionForm/BasicInfoSection.tsx`

### Commit Message Convention

When refactoring for file size:

- `refactor: split SessionForm into smaller components`
- `refactor(session): extract useSessionValidation hook from SessionForm`

This helps track refactoring progress over time.

### New Updates
