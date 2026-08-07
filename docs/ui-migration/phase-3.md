# Phase 3: public Guide

Completed on 2026-08-03.

## Migrated scope

- Guide page shell, hero, table of contents, and footer.
- Getting Started, Sessions, Tournaments, Payments, Clubs, Ratings, and Tips
  sections.
- Repeated presentation patterns are composed from shared Guide primitives:
  section header, guide card, role column, and screenshot placeholder.
- Screenshot placeholder copy is localized in Vietnamese, English, and Chinese.
- The table of contents now uses semantic anchors instead of click handlers on
  generic layout elements.

Auth forms, feedback submission, global navigation, and feature workflows remain
outside this phase so the rollback boundary stays limited to one public route.

## Chakra boundary

- Allowlisted files before Phase 3: 532
- Allowlisted files after Phase 3: 522
- Import declarations before Phase 3: 539
- Import declarations after Phase 3: 529

Phase 3 removes 10 Chakra import declarations without adding new Chakra usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui`
- `pnpm build`

The UI suite now contains twelve desktop Chromium and mobile WebKit cases. Guide
coverage checks all three locales, horizontal overflow, semantic landmarks,
keyboard table-of-contents navigation, and serious/critical Axe findings.

Lint retains existing warnings outside this phase. The production build retains
the existing `playerStatus` missing-message warning during prerendering.
