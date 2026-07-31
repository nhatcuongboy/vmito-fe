// Cover-photo transforms for session cards. These live outside the card
// components because the home page preloads the first card's cover as the LCP
// image and has to build a byte-identical URL — and a server component can't
// safely read a value exported from a 'use client' module.

// 800x380 — BaseSessionCard / FindSessionCard, view=grid.
export const GRID_COVER_TRANSFORM = {
  cloudinaryWidth: 800,
  cloudinaryHeight: 380,
} as const;

// 600x400 = 3:2 at 2x DPR for the widest render (~280px at lg 4-col).
// SessionCardCompact, view=list.
export const COMPACT_COVER_TRANSFORM = {
  cloudinaryWidth: 600,
  cloudinaryHeight: 400,
} as const;

// 640x360 = 16:9 at 2x DPR for the widest render (~320px at lg 3-col).
// TournamentCard — 16:9 because tournament posters are banner-shaped.
export const TOURNAMENT_COVER_TRANSFORM = {
  cloudinaryWidth: 640,
  cloudinaryHeight: 360,
} as const;
