# Phase 2: low-risk public surfaces

Completed on 2026-08-03.

## Migrated scope

- Shared states: `AppEmptyState`, `AppErrorState`, and `LoadingSpinner`.
- Public About page: hero, use cases, steps, testimonials, FAQ, CTA, and footer.
- Settings placeholder page.
- Privacy and Terms pages, backed by a shared semantic legal-document layout.
- Added the shadcn Accordion primitive and hardened the shadcn Button styles for
  the temporary Chakra/Tailwind reset coexistence period.

The shared state component APIs remain compatible with their existing callers,
including Chakra-style responsive values. This keeps Phase 2 isolated from
feature pages scheduled for later phases.

## Chakra boundary

- Allowlisted files before Phase 2: 545
- Allowlisted files after Phase 2: 532
- Import declarations before Phase 2: 552
- Import declarations after Phase 2: 539
- Verification: `pnpm ui:audit:chakra`

Phase 2 removes 13 Chakra import declarations without adding new Chakra usage.

## Acceptance checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm ui:audit:chakra`
- `pnpm test:e2e:ui`
- `pnpm build`

The UI suite now covers ten desktop Chromium and mobile WebKit cases: light and
dark About baselines, all locale shells, keyboard FAQ disclosure, horizontal
overflow, semantic landmarks, and serious/critical Axe findings on all Phase 2
routes.

The production build still logs the existing `playerStatus` translation warning
while prerendering, and lint retains the repository's existing warnings. Both
commands complete successfully.
