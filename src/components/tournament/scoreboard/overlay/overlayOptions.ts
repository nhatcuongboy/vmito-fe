'use client';

import { useEffect } from 'react';

/** OBS-oriented display options parsed from the overlay URL query string. */
export interface OverlayOptions {
  /** Transparent by default so the livestream shows through in OBS. */
  background: 'transparent' | 'solid';
  /** Show the tournament title strip. */
  showTitle: boolean;
  /** Show the category / round label strip. */
  showRound: boolean;
  /** Anchor the bar to the top or bottom of the frame. */
  position: 'top' | 'bottom';
  /** Uniform scale multiplier (clamped 0.5–3). */
  scale: number;
}

const parseBool = (value: string | null, fallback: boolean): boolean => {
  if (value === null) return fallback;
  return value !== '0' && value.toLowerCase() !== 'false';
};

/**
 * Parse overlay display options from URLSearchParams. Supported params:
 *   - bg=transparent|solid            (default transparent)
 *   - labels=0                        hides both title + round strips
 *   - title=0 / round=0               hide each strip individually
 *   - pos=top|bottom                  (default bottom)
 *   - scale=1.2                       (default 1)
 */
export function parseOverlayOptions(
  searchParams: URLSearchParams
): OverlayOptions {
  const labels = parseBool(searchParams.get('labels'), true);
  const scaleRaw = Number(searchParams.get('scale'));
  const scale =
    Number.isFinite(scaleRaw) && scaleRaw > 0
      ? Math.min(3, Math.max(0.5, scaleRaw))
      : 1;

  return {
    background: searchParams.get('bg') === 'solid' ? 'solid' : 'transparent',
    showTitle: labels && parseBool(searchParams.get('title'), true),
    showRound: labels && parseBool(searchParams.get('round'), true),
    position: searchParams.get('pos') === 'top' ? 'top' : 'bottom',
    scale,
  };
}

/**
 * Make the page background transparent while an overlay is mounted so an OBS
 * browser source composites cleanly over the video. Restores the previous
 * values on unmount. No-op when the overlay is rendered on a solid background.
 */
export function useTransparentPageBackground(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    const html = document.documentElement;
    const { body } = document;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = 'transparent';
    body.style.background = 'transparent';
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, [enabled]);
}
