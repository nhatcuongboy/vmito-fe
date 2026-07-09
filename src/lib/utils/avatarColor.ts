const PALETTE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'cyan',
  'purple',
  'pink',
] as const;

/**
 * Deterministic background color token for an avatar based on a seed string
 * (e.g. user name/id) — same seed always maps to the same color, and
 * different seeds are spread across a fixed palette for visual variety.
 */
export function getAvatarBgColor(seed: string): string {
  if (!seed) return `${PALETTE_COLORS[0]}.500`;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return `${PALETTE_COLORS[Math.abs(hash) % PALETTE_COLORS.length]}.500`;
}
