# Phase 5: shared application shells and route guards

Completed on 2026-08-04.

## Migrated scope

- `MainLayout`, including fixed positioning, responsive sidebar offset, top-bar
  safe-area spacing, scroll ownership, background, and content padding.
- `PageWrapper`, including responsive sidebar offset and light/dark background
  handling.
- Public and protected route guards, including hydration, redirect, loading,
  access-denied, required-role, referee, and VIP host-access states.
- The `PageLayout` boundary now casts its remaining Chakra conditional values
  into the deliberately small compatibility surface exposed by `PageWrapper`.

The shell compatibility layer accepts only the legacy props still used by
current callers (`bg`, `background`, `bgColor`, `backgroundColor`, `_dark`,
`minH`, and the `ml={0}` opt-out). They are converted to CSS variables instead
of forwarding framework-specific props to the DOM.

`TopBar`, sidebar navigation, `PageLayout` content primitives, footer, and
detail skeletons remain outside this phase. Their interaction behavior and
larger consumer surfaces will be migrated independently.

## Chakra boundary

- Allowlisted files before Phase 5: 517
- Allowlisted files after Phase 5: 513
- Import declarations before Phase 5: 524
- Import declarations after Phase 5: 520

Phase 5 removes four direct Chakra import declarations without adding new
Chakra usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui` — 22 tests across desktop Chromium and mobile WebKit
- `pnpm build`

Browser coverage now verifies desktop/mobile sidebar offsets, fixed-shell
positioning, internal scroll ownership, anonymous protected-route redirects,
horizontal overflow, and serious/critical Axe violations. Lint retains existing
warnings outside this phase. The production build retains the existing
`playerStatus` missing-message warning during prerendering.
