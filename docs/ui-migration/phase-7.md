# Phase 7: navigation drawer and sidebar controls

Completed on 2026-08-04.

## Migrated scope

- Replaced the Chakra-based `SlideOutMenu` shell with semantic HTML, project
  tokens, and responsive CSS while preserving the existing public API and route
  visibility rules.
- Migrated `SidebarNavItem` and the sessions submenu, including active states,
  the expanded disclosure, and the collapsed Radix popover flyout.
- Migrated the sidebar language and theme switchers to accessible native
  controls while preserving locale query parameters, theme cycling, and drawer
  behavior.
- Added localized accessible naming for the mobile overlay and all collapsed
  icon-only controls.
- Added Escape-to-close support on mobile and ensured the desktop-only collapsed
  state is not inherited by the mobile drawer.

The navigation tree remains configuration-driven through `NAV_SECTIONS`.
`VTooltip` and `NextLinkButton` were intentionally left unchanged because they
still have consumers outside this boundary. `TournamentGuideButton` remains a
legacy conditional child and can be migrated with the tournament navigation
boundary.

## Chakra boundary

- Allowlisted files before Phase 7: 510
- Allowlisted files after Phase 7: 505
- Import declarations before Phase 7: 517
- Import declarations after Phase 7: 512

Phase 7 removes five direct Chakra import declarations without adding new
Chakra usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui` — 26 tests across desktop Chromium and mobile WebKit
- `pnpm build`

Browser coverage verifies the 240px to 72px desktop transition, synchronized
page offset, accessible names for collapsed controls, full-page serious/critical
Axe scans after collapse and while the mobile drawer is open, overlay and Escape
closing, horizontal overflow, and visual snapshots for desktop and mobile.

## Sidebar standardization follow-up

- Standardized the sidebar behavior layer on the project's shadcn-style Radix
  primitives: Collapsible for the expanded sessions submenu, Popover for its
  collapsed flyout, and DropdownMenu radio groups for language and theme.
- Migrated `TournamentGuideButton` from Chakra to the internal Button and
  Tooltip primitives without changing its public props or toggle event.
- Kept the custom semantic aside, mobile overlay, navigation links, 240px/72px
  geometry, route configuration, and sport-tech shell styling unchanged.
- Set application-shell typography explicitly: 15px/20px primary navigation,
  13px/18px inline submenu, 14px/20px utility and flyout controls, and
  11px/16px section headings. Single-line labels now truncate safely in all
  supported locales.
- Removed one additional Chakra import declaration. The current audit baseline
  is 531 files / 538 imports.

## Follow-up for Phase 8

Migrate the authenticated top-bar actions (`UserMenu` and
`NotificationBell`) plus directly coupled popovers/modals. Keep the boundary
small enough to test anonymous and authenticated navigation independently; defer
standalone `SidebarNav`, `CitySelector`, and tournament-specific navigation if
they introduce unrelated state or API behavior.

Lint retains existing warnings outside this phase. The production build retains
the existing `playerStatus` missing-message warning during prerendering.
