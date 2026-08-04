Design a detailed implementation plan for the Next.js app at /Users/cuongvnnguyen/Documents/vmito/vmito-fe. Read the files referenced below before designing. Validate or correct my proposed design — push back where it's wrong.

# Background: what was just shipped (the pattern to follow)

The home page ("Tìm kèo", `src/app/[locale]/page.tsx`) server-seeds its first page of session results for LCP. It had a bug: the server fetched WITHOUT a city filter while the client fetched WITH `city=<preferredCity>` (preferredCity lives in localStorage via zustand persist, invisible to the server). Users saw one list get swapped for another. The fix, already merged, established this pattern — READ THESE FILES FIRST, they are the template:

- `src/lib/preferred-city.ts` (NEW) — server-safe module (no 'use client'): `PREFERRED_CITY_COOKIE`, `cityCodeToApiName(code)`, `readPreferredCityCookie()`, `writePreferredCityCookie(code)`.
- `src/stores/usePreferenceStore.ts` — writes the cookie in `setPreferredCity`/`setPreferredArea` and mirrors localStorage→cookie in `onRehydrateStorage`.
- `src/app/[locale]/page.tsx` — `export const dynamic = 'force-dynamic'`; a `FILTER_PARAMS` bail-out list; `getInitialSessions(city)`; reads `cookies()` + `searchParams`; passes `initialSessions`, `initialSessionsCity`, `serverViewMode`; emits an LCP `<link rel="preload" as="image">` built with `normalizeImageUrl` + a transform from `src/lib/images/coverTransforms.ts`.
- `src/components/session/FindSessionList.tsx` — props `initialSessions`/`initialSessionsCity`/`serverViewMode`; `useState(initialSessions)`; `loading` seeded from `initialSessions.length === 0`; `silentRevalidateRef`; `isFirstFetchRef`; a seed-discard guard (if the client's resolved city !== the server's, clear the seed and show skeletons rather than display the wrong city); the fetch effect gated on the preference store's `_hasHydrated`.
- `src/hooks/useViewMode.ts` — resolution order URL `?view` → cookie `view-mode-<scope>` → legacy localStorage → `serverViewMode` → default.

# The task

Extend the same server-seeding to `/venues` and `/clubs`, plus a small unrelated date-format fix.

# Key constraint discovered during research

BOTH pages default to `sort = 'distance'`, which needs `lat/lng` from `navigator.geolocation` — never persisted anywhere today, so the server cannot reproduce the query.

- **Venues** (`src/components/venue/VenueSearchList.tsx`): `requiresUserLocation = filters.sort === 'distance' || filters.near` (line ~226). The fetch effect (lines ~403-428) returns early and holds `loading=true` until geolocation resolves. On denial, the catch at line ~212 does `setFilters({ sort: 'relevance', near: false })`. So: slow, but only ever one list.
- **Clubs** (`src/app/[locale]/clubs/BrowseClubsContent.tsx`): does NOT gate. First fetch runs with `userLocation === null`, hits the branch at lines ~347-350 that downgrades to `sortBy:'relevance', sortOrder:'desc'`, renders that list, then geolocation resolves → the effect (lines ~413-427, `userLocation` in deps) refetches with distance and REPLACES the list. This is already the same "two different lists" bug, purely client-side.

**The user has decided: persist the granted location in a cookie** (rounded for privacy), same pattern as preferred-city.

# My proposed design — validate, correct, and detail it

## Part A — new `src/lib/user-location.ts` (server-safe, no 'use client')

- `USER_LOCATION_COOKIE = 'user-location'`, value `"10.771,106.698"`.
- Round to 3 decimal places (~110 m): privacy-reasonable, and below the 0.1 km display granularity of `formatDistance` in `src/lib/utils/geolocation.utils.ts`.
- Exports: `roundCoord`, `parseUserLocationCookie(raw)` (server-safe), `readUserLocationCookie()` (client, document.cookie), `writeUserLocationCookie(loc)`, `clearUserLocationCookie()`, and `locationKey(loc|null): string` for seed-match comparison.
- `max-age` ~7 days, `SameSite=Lax`.

## Part B — the fast path that makes seeding actually match

This is the crux. Instead of the client waiting on `navigator.geolocation` before its first fetch:

1. Initialize `userLocation` state from `readUserLocationCookie()` (the rounded coords from last visit) instead of `null`.
2. The first client fetch therefore runs immediately with the SAME rounded coords the server used → server seed and client fetch are identical → silent revalidate keeps the cards, no flash.
3. In the background still call `getUserLocation()`; only `setUserLocation` + rewrite the cookie **if the freshly-rounded value differs** from the current one (otherwise the object identity change would cause a pointless refetch — note both pages currently put the raw `userLocation` object in their effect deps, so this needs a stable string key instead).
4. First-ever visit (no cookie): no seed, skeletons, geolocation, fetch — same as today.
5. On geolocation denial: clear the cookie, plus the existing `sort → 'relevance'` fallback.

I believe this also **fixes the clubs client-side reorder bug** for repeat visitors, since the first fetch already has a location. Confirm whether clubs should ALSO be changed to gate its first fetch on geolocation like venues does (making the two pages consistent), or whether the cookie fast-path alone is enough — weigh the 10s `getUserLocation` timeout risk of gating.

## Part C — seed-match key

Generalize the sessions page's `initialSessionsCity` string comparison into a compact "query key" string covering city + sortBy/sortOrder + location, e.g. `"HCM|distance|asc|10.771,106.698"`. Server computes it, passes it as a prop; client recomputes and, on the first fetch, discards the seed (clear list, show skeletons) when they differ. Propose the exact key shape and where the shared builder should live so server and client cannot drift.

## Part D — `page.tsx` for both routes

Mirror the home page: `export const dynamic = 'force-dynamic'`, async page reading `searchParams` + `cookies()`, a bail-out list of filter params, a raw `fetch` with `next: { revalidate: 60 }`, and the LCP preload link.

Critical details to get right (verify each against the code):

- Venues endpoint `GET /venues/search`, envelope `{success, data:{data:Venue[], pagination}}` → unwrap `json?.data?.data`. Param order/name list is in `VenueSearchList.tsx` ~lines 292-346, including the hard-coded `closureStatus: 'OPERATING'`.
- Clubs endpoint `GET /clubs`, envelope `{success, data:{items, total, page, limit, totalPages}}` → unwrap `json?.data?.items`. **Different from the sessions/venues shape — do not copy `json?.data?.data`.**
- Bail-out params: venues has a real `useUrlFilters` schema (`q, city, district, near, sort, favorite` — `VenueSearchList.tsx` ~155-162). Clubs does NOT use `useUrlFilters` at all; its only URL-backed filter is `?favorite=1` (plus `?view`), everything else is plain `useState` defaults — so clubs is easier to seed. Confirm this.
- Skip seeding when `?view=map` (both pages fetch 500 rows in map mode).
- Unauthenticated server fetch means `isFavorite` is always false in the seed; note the implications.

## Part E — LCP image preload

Neither `src/components/venue/VenueCard.tsx` (lines ~131-138, ~318-325) nor `src/components/clubs/ClubCard.tsx` (lines ~142-147, ~312-318) uses `normalizeImageUrl`; both render a raw Chakra `<Image src={x.coverPhoto || DEFAULT_COVER_PHOTO}>` into a fixed `h="140px"` box, with no `loading`/`fetchPriority`. Propose transforms to add to `src/lib/images/coverTransforms.ts` (existing: 800×380, 600×400, 640×360) and an `imagePriority` prop mirroring `BaseSessionCard.tsx` (~line 188, plumbed from `FindSessionList.tsx` via `index === 0`).

## Part F — `serverViewMode` threading

`VenueSearchList.tsx:184` uses `useViewMode('venues','list')` and clubs `BrowseClubsContent.tsx:200` uses `useViewMode('clubs','list')`, neither passing `serverViewMode`. `src/components/common/AppViewModeToggle.tsx:20` also calls `useViewMode(scope, defaultMode)` with no server value and has no such prop. Without this, SSR resolves to 'list' and hydration flips the layout for anyone whose cookie says grid/map.

## Part G — two known gotchas to guard

- Both `fetchVenues`/`fetchClubs` call `window.scrollTo({top:0, behavior:'smooth'})` on every non-load-more fetch (`VenueSearchList.tsx` ~285-288, `BrowseClubsContent.tsx` ~391-393) — that would scroll-jump on the seeded first fetch.
- Clubs' fetch effect refires when `preferredCity` goes null→'HCM' on store rehydration; sessions solved this with a `_hasHydrated` gate. Note: zustand persist with sync localStorage actually hydrates synchronously at store creation, so verify whether this is a real double-fetch or only theoretical.

## Part H — unrelated small fix

`src/app/[locale]/clubs/[id]/components/ClubAnnouncementsTab.tsx:256` and `ClubMembersTab.tsx:559` call `new Date(x.createdAt).toLocaleDateString()` with NO locale argument — non-deterministic across environments (Node en-US "8/4/2026" vs browser vi-VN "4/8/2026") and ambiguous to users. User decided: use `dayjs(...).format('DD/MM/YYYY')`, matching `PendingJoinRequestModal.tsx:32`. Specify whether to import from `dayjs` directly (as PendingJoinRequestModal does) or from the configured `@/lib/dayjs` (which extends utc/timezone plugins and sets the vi locale + Asia/Ho_Chi_Minh default) — recommend one and say why.

# Deliverable

A precise, ordered implementation plan: which files to create/modify, what each change is, the exact shape of new shared helpers, and the sequencing so the work can be done incrementally without a broken intermediate state. Flag anything in my design that is wrong, risky, or over-engineered — especially if you think Part B's cookie fast-path has a flaw, or if any part should be dropped to reduce scope. Also propose how to verify each piece end-to-end (the dev server runs at http://localhost:3000 and the API at https://vmito.com/api; server-rendered HTML can be inspected with `curl -H 'Cookie: ...'`).
