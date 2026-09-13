# `/venues` performance: before vs after

This file records how the `/venues` optimization work (virtualized list,
resized avatars, cookie-based sidebar state, coordinated pagination, seeded
SSR data) was verified.

## Method

- Production build (`pnpm build` + `next start --port 3101`), never a dev build.
- Chromium, 1280×800, logged out, `/vi/venues?sort=name_asc`.
- Deterministic data: 300 venues (25 pages × 12), 100 ms API latency, Cloudinary
  responses stubbed with a local PNG.
- Measured via a throwaway Playwright script driving the production server and
  recording DOM size, image count, long tasks and CLS before/after the change.
  Baseline was captured from `HEAD` (5307d445) with the same method.

## Results

| Metric                                     | Before |  After |
| ------------------------------------------ | -----: | -----: |
| First Load JS for `/[locale]/venues`       | 416 kB | 358 kB |
| FCP (ms)                                   |    340 |    120 |
| DOM nodes after 4 scroll steps             |  1,784 |  1,002 |
| DOM nodes with 300 venues loaded           |  8,589 |    918 |
| `<img>` elements with 300 venues loaded    |    603 |     33 |
| Long tasks while loading 300 venues        |     24 |      1 |
| Total long-task time (ms)                  |  1,531 |     55 |
| Longest task (ms)                          |    139 |     55 |
| CLS                                        | 0.0009 | 0.0009 |
| Search requests / duplicate pages          | 25 / 0 | 25 / 0 |
| Original (untransformed) Cloudinary images |    300 |      0 |
| Router prefetch requests                   |      9 |      0 |
| JS requests                                |     60 |     39 |

The only remaining layout shift (0.0009) comes from `.navigation-copyright` and
existed before this work.

## Automated checks

- `pnpm typecheck`: passes.
- `pnpm test:venue-browse`: unit tests for query identity, the request lane and
  de-duplicated page merging.
- `e2e/venues-performance.spec.ts`, 16/16 passing on desktop Chromium and
  iPhone 13 (WebKit) against the production build:

  ```bash
  INTERNAL_API_URL=http://127.0.0.1:3102/api pnpm start --port 3101 &
  VENUES_BASE_URL=http://127.0.0.1:3101 pnpm test:e2e e2e/venues-performance.spec.ts
  ```

  Covers: bounded DOM and sequential pages for 300 results, sized `f_auto`
  images, no sidebar prefetch, keyboard focus kept across virtualization,
  scroll/data restore on back navigation, next-page failure and retry, and
  sidebar cookie and legacy localStorage migration — these run without extra
  setup. Four more cases (matching and empty SSR seeds vs a failed SSR fetch,
  authenticated seed reconciliation, and search changes while a slow request
  is in flight) are gated behind `VENUES_SSR_FIXTURE=1` and `test.skip` when
  it isn't set, since they need a local `/venues/search` fixture on `:3102`
  that stood in for `INTERNAL_API_URL` during this work and was not kept in
  the repo — recreate one (any server answering that path deterministically)
  to re-run them.

## Not covered by automation

- Dark mode visuals and manual mobile sidebar checks.
- Real network or production data. The numbers above use fixtures.
- Ctrl+F only finds venues in rendered rows (an accepted virtualization trade-off).
