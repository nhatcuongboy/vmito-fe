# Phase 6: top bar and top-level navigation presentation

Completed on 2026-08-04.

## Migrated scope

- `TopBar` fixed shell, responsive layout, logo, title alignment, back/menu/login
  controls, desktop search slot, authenticated action slots, and safe-area sizing.
- `SubNavigation`, including active-route state, horizontal scrolling, focus
  treatment, and `aria-current` semantics.
- The AI assistant top-bar trigger, including active, hover, keyboard-focus, and
  reduced-motion-compatible presentation.
- Localized the previously hardcoded menu accessible name for Vietnamese,
  English, and Chinese.
- Added stable navigation drawer state hooks to verify the existing
  `SlideOutMenu` integration without rewriting that larger component in this
  phase.

The existing public `TopBar` API remains compatible with all callers. Heavy
authenticated actions (`NotificationBell` and `UserMenu`) remain dynamically
loaded, while the persistent desktop `SlideOutMenu` remains eagerly rendered to
avoid a blank sidebar gap.

`SlideOutMenu`, its navigation items/switchers, `UserMenu`, `NotificationBell`,
`CitySelector`, and the reusable standalone `SidebarNav` remain on Chakra and
form the next migration boundary.

## Chakra boundary

- Allowlisted files before Phase 6: 513
- Allowlisted files after Phase 6: 510
- Import declarations before Phase 6: 520
- Import declarations after Phase 6: 517

Phase 6 removes three direct Chakra import declarations without adding new
Chakra usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui` — 24 tests across desktop Chromium and mobile WebKit
- `pnpm build`

Browser coverage verifies fixed positioning, desktop sidebar collapse from
240px to 72px, synchronized page offset, mobile drawer open/overlay close,
localized accessible naming, horizontal overflow, and serious/critical Axe
checks scoped to the migrated top bar.

## Follow-up for Phase 7

The expanded legacy sidebar passes the existing page-level accessibility scan.
Scanning it after desktop collapse also exposes pre-existing icon-only buttons
and links without accessible names. Phase 7 should resolve those names while
migrating `SlideOutMenu` and its directly coupled controls rather than disabling
the Axe rule.

Lint retains existing warnings outside this phase. The production build retains
the existing `playerStatus` missing-message warning during prerendering.
