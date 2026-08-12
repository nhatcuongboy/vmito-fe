# Detail Page Layout Pattern

Reusable layout recipe extracted from the venue detail page
([venues/[id]](../src/app/%5Blocale%5D/venues/%5Bid%5D)) after aligning it with the
session detail page. Use this as the starting point for any new "detail" page
(club detail, tournament detail, etc.) instead of inventing a new structure.

## Reference implementation

- Page shell: [VenueDetailClient.tsx](../src/app/%5Blocale%5D/venues/%5Bid%5D/VenueDetailClient.tsx)
- Hero: [VenueDetailHero.tsx](../src/components/venue/VenueDetailHero.tsx)
- Sticky mini header: [AppDetailStickyHeader.tsx](../src/components/common/AppDetailStickyHeader.tsx)
- Content cards: [VenueAboutCard.tsx](../src/components/venue/VenueAboutCard.tsx),
  [VenuePricingSection.tsx](../src/components/venue/VenuePricingSection.tsx),
  [VenuePhotosSection.tsx](../src/components/venue/VenuePhotosSection.tsx)
- Sidebar cards: [VenueContactCard.tsx](../src/components/venue/VenueContactCard.tsx),
  [VenueLocationCard.tsx](../src/components/venue/VenueLocationCard.tsx)
- Mobile CTA bar: [VenueDetailStickyBar.tsx](../src/components/venue/VenueDetailStickyBar.tsx)
- The equivalent, older implementation of the same pattern: session detail page
  ([PublicSessionDetailContent.tsx](../src/components/session/PublicSessionDetailContent.tsx),
  [SessionDetailHero.tsx](../src/components/session/SessionDetailHero.tsx))

## Overall structure

```
PageLayout (hideTopBarOnMobile)
├── Hero (full-bleed image/carousel, mobile only back/share float over it)
├── AppDetailStickyHeader (fixed, fades in once hero scrolls away — mobile only)
├── Info card (name + key facts + primary contact, mobile-only extras folded in)
└── Grid: 2.3fr / 1fr
    ├── Left column (flows first on mobile)
    │   ├── Main "about" card (description + sub-sections, Separator-divided)
    │   ├── Pricing / structured-data card
    │   └── Photos section (optional)
    └── Right column ("sidebar" on desktop, tail content on mobile)
        ├── Quick info card (desktop only — duplicated into the info card on mobile)
        ├── Primary CTA card (desktop only — duplicated into the sticky bar on mobile)
        ├── Contact card (desktop only — duplicated into the info card on mobile)
        ├── Location / map card (always shown, once)
        ├── Secondary actions (report/edit link)
        └── View count footer
Fixed mobile bottom bar (price + primary CTA + call), via Portal
```

The key idea: **the sidebar and the mobile "info card" are not two different
designs — they show the same data, but each visibility-toggles the parts the
other one already covers**, so nothing renders twice and nothing is missing.

## Desktop (`md`/`lg`+)

- `PageLayout`'s normal `TopBar` is visible (title, back button, actions).
- Hero renders as a rounded card capped at `DETAIL_PAGE_MAX_W` (currently
  `1095px`), not full-bleed.
- Content splits into a 2-column `Grid` (`templateColumns: '2.3fr 1fr'`):
  - **Left (2.3fr)**: main narrative content — about/description, pricing,
    photos. One card per concern, but sub-sections within a concern (e.g.
    description + layout image + amenities) are merged into a single card
    separated by `Separator`, not stacked as separate cards.
  - **Right (1fr)**: `position: sticky; top: 80px` sidebar with quick facts,
    the primary call-to-action, contact, and location/map. This column is
    `display: none` on mobile piece by piece (see below) — it is not one
    `display: none` on the whole column, because some of its cards (location)
    are still needed on mobile.
- No sticky bottom bar; the CTA/contact buttons live in the sidebar and are
  reachable by scrolling.
- No mobile-only sticky mini header — the always-present `TopBar` already
  serves that role.

## Mobile (`base`)

### 1. Full-bleed hero + floating chrome

- Hero image cancels `PageLayout`'s side padding to run edge-to-edge:
  `w="calc(100% + 48px)" mx="-24px"` (48px/24px = 2× the layout's
  `CONTAINER_PX`), `borderRadius={{ base: 0, md: '2xl' }}`.
- `PageLayout` is given `hideTopBarOnMobile` so the normal `TopBar` does not
  double up with this. That prop makes `PageLayout` hide the bar under
  `display: { base: 'none', md: 'block' }` and drop the mobile top padding to
  `0px` so content (the hero) starts at the very top of the screen.
- Because there is no `TopBar` on mobile, the hero **must** carry its own:
  - Back button: `IconButton`, `position: absolute`, `top: calc(env(safe-area-inset-top) + 8px)`, circular, `bg="blackAlpha.500"` + `backdropFilter="blur(6px)"` so it reads over any image.
  - Share (+ favourite) button: same visual treatment, `top-right`.
  - A `to-b` gradient overlay behind the top controls and a `to-t` gradient
    behind the bottom badges, both `pointerEvents: 'none'`, so text/icons stay
    legible regardless of the photo.
  - Status/sport/verified badges anchored `bottom-left`, offset past the back
    button (`left: '56px'` on mobile) so they never collide.

### 2. Sticky mini header (`AppDetailStickyHeader`)

- Because the real `TopBar` is hidden, once the user scrolls the hero out of
  view there is **nothing** identifying the page or offering a way back. This
  component fixes that:
  - Drop a 1px sentinel right after the hero.
  - `IntersectionObserver` on that sentinel flips `isPinned` once its top
    edge passes above the viewport.
  - A `position: fixed; top: 0` bar (rendered through a `Portal`, `display:
{ base: 'flex', md: 'none' }`) with a back button + single-line title
    fades/slides in (`opacity` + `translateY`, 0.2s) only once pinned.
  - Height matches `TOP_BAR_HEIGHT_MOBILE`, includes
    `env(safe-area-inset-top)`.
- **Reusable as-is** — it takes `title`, `onBack`, and optional
  `rightContent`; both the venue and the session detail pages use the exact
  same component.

### 3. Info card duplicates the sidebar's "identity" data

Right below the hero, one card carries everything needed to recognize the
place/thing without scrolling further:

- Name (bigger heading, `size={{ base: 'xl', md: '2xl' }}`, `fontWeight="bold"`)
  - full address (not a district/city summary — the address is the thing
    people actually decide on).
- Optional small logo/avatar (`only render it when the image actually
exists` — no generic placeholder icon; a placeholder pin/avatar takes width
  away from the name and reads as clutter, not information).
- A `display={{ base: 'flex', lg: 'none' }}` row of "quick facts" (hours,
  capacity, etc.) — this is the mobile-only mirror of the sidebar's "Quick
  info" card.
- A `display={{ base: 'block', lg: 'none' }}` contact block
  (`variant="inline"`, no card chrome) — mobile-only mirror of the sidebar's
  contact card. It intentionally **drops the "call" button** because the
  fixed bottom bar already has one; only Zalo/website stay.
- Admin-only action buttons, own row so they never crowd the name.

### 4. Single continuous scroll, no tabs

- The former "About / Photos" tab bar was removed. Two tabs for this much
  content added a navigation layer without adding value, and it created an
  awkward double-sticky-bar situation (tabs sticky under a sticky TopBar).
- All content sections stack in one scroll, in priority order: about →
  pricing → photos.
- Sub-sections that used to be separate cards (description, layout image,
  amenities) are merged into one card with `Separator` between them — fewer
  cards means less scrolling and less visual noise for closely related info.
- Long free-text (description) is clamped (`maxH`, `overflow: hidden`) with a
  gradient fade + "Show more/less" toggle, only rendered when the content
  actually overflows the clamp height (measured via `scrollHeight`).
- Tables that need horizontal scroll on desktop (e.g. a pricing grid) get a
  **separate, mobile-specific grouped-list rendering** instead of forcing
  horizontal scroll on a phone. Duplicate values across columns (e.g. "fixed"
  and "walk-in" price being equal) collapse into a single line instead of
  repeating the same number twice.

### 5. Sidebar content re-appears below the main content, minus what's already shown

- The right column is **not** `display: none` wholesale on mobile. Instead,
  each card inside it decides for itself:
  - Quick info card → `display: { base: 'none', lg: 'block' }` (already in
    the info card).
  - Primary CTA card → visible on mobile **only when its mobile action isn't
    already covered by the sticky bottom bar** (e.g. shown when rental is
    enabled, because then the sticky bar's single button is "Book court" and
    the "Find sessions" action still needs a home).
  - Contact card → `display: { base: 'none', lg: 'block' }` (already inline
    in the info card).
  - Location/map card → always visible, exactly once. Do **not** also show
    the address text here if it's already in the info card — a map + a
    "Directions" button is what this section is for; repeating the address
    string next to a pin icon is pure duplication.
  - Secondary "report an issue" link and the view-count footer → always
    visible, at the very end.
- A trailing spacer `Box` (`h="calc(72px + env(safe-area-inset-bottom))"`,
  mobile-only) reserves room so the last real content isn't hidden behind the
  fixed bottom bar.

### 6. Fixed mobile bottom bar

- Rendered through a `Portal`, `display: { base: 'block', md/lg: 'none' }`,
  `position: fixed; bottom: 0`.
- Shows the most decision-relevant number (price, or whatever the page's
  "cost to act" is) on the left and 1–2 action buttons on the right (e.g. a
  call icon button + the primary CTA button).
- This is the mobile home for the sidebar's primary CTA — on desktop that
  same action lives in the sidebar card instead, so it's never rendered
  twice.

## Checklist for adapting this to a new detail page

1. `PageLayout` with `hideTopBarOnMobile` and `maxW={DETAIL_PAGE_MAX_W}`.
2. Build a `<Entity>DetailHero` component: full-bleed on mobile / rounded
   card on desktop, own back+share buttons only rendered on mobile
   (`display={{ base: 'flex', md: 'none' }}`), gradients behind any
   floating controls, badges anchored away from the back button.
3. Drop `<AppDetailStickyHeader title=… onBack=… />` right after the hero —
   reuse the shared component, don't re-implement it.
4. Info card: name + address/summary + mobile-only quick facts + mobile-only
   contact (`variant="inline"`, no call button if the bottom bar has one).
5. Single `Grid` (`{ base: '1fr', lg: '2.3fr 1fr' }`), no tabs. Left column =
   narrative content merged into as few cards as reasonably possible with
   `Separator`s. Right column = sidebar cards, each individually toggled with
   `display={{ base: 'none', lg: 'block' }}` unless it's a card that must
   stay visible on mobile too (location/map, footer links).
6. Any wide table gets a mobile-specific compact rendering instead of forcing
   horizontal scroll.
7. `<Entity>DetailStickyBar` via `Portal`, mobile/tablet only, carrying the
   one primary action + secondary quick actions (call, price).
8. Audit for duplication before shipping: run the page at a mobile width and
   list every heading/section visible top-to-bottom — the same fact (address,
   phone, CTA) should appear in exactly one place at a time.
