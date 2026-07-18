// Cover-photo transforms for session cards. These live outside the card
// components because the home page preloads the first card's cover as the LCP
// image and has to build a byte-identical URL — and a server component can't
// safely read a value exported from a 'use client' module.

// 800x380 — BaseSessionCard / FindSessionCard, view=grid.
export const GRID_COVER_TRANSFORM = {
  cloudinaryWidth: 800,
  cloudinaryHeight: 380,
} as const;

// 600x450 = 4:3 at 2x DPR for the widest render (~280px at lg 4-col).
// SessionCardCompact, view=list.
export const COMPACT_COVER_TRANSFORM = {
  cloudinaryWidth: 600,
  cloudinaryHeight: 450,
} as const;
