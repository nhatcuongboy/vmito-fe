# UI migration baseline

Captured on 2026-08-03 after the shadcn dual-stack foundation was installed.
Use the same production build and Playwright commands when comparing later
migration phases.

## Chakra boundary

- Allowlisted files: 545
- Allowlisted import declarations: 552
- Source of truth: `scripts/chakra-allowlist.txt`
- Verification: `pnpm ui:audit:chakra`

The allowlist is exact: adding a Chakra import, moving one to a new file, or
leaving a stale entry after migration fails the audit.

## Production build

Command: `pnpm build`

| Asset group              | Files | Raw bytes | Gzip bytes |
| ------------------------ | ----: | --------: | ---------: |
| Client JavaScript chunks |   274 | 8,517,077 |  2,594,941 |
| Client CSS               |     1 |    70,959 |     13,289 |

These totals cover all route chunks rather than the payload of a single route.
They are intended to detect broad regressions and confirm that Chakra/Emotion
chunks disappear by the final decommission phase.

## Browser baseline

Command: `pnpm test:e2e:ui`

- Desktop Chromium: light, dark, and locale-shell smoke coverage.
- Mobile WebKit (iPhone 13): light, dark, and locale-shell smoke coverage.
- All six tests pass.
- Each run captures full-page About screenshots into `test-results`; CI uploads
  them as a 14-day artifact instead of committing platform-sensitive images.
- Blocking accessibility impacts: serious and critical.

## Known pre-existing debt

- ESLint exits successfully but reports existing warnings.
- `pnpm i18n:check` is not a CI gate yet: the baseline has 43 CN keys missing,
  21 VI-only keys, and 4 CN-only keys.
- The About page currently has minor/moderate Axe findings for landmarks and a
  redundant logo alternative. These become Phase 2 acceptance items when that
  page is migrated.
