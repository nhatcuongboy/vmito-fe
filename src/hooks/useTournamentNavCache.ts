'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import {
  readTournamentNavCache,
  TournamentNavAccess,
} from '@/lib/tournamentNavCache';

// sessionStorage can't be read during SSR/hydration renders without causing a
// hydration mismatch (server HTML shows the 4 public tabs, client shows the
// cached management tabs). Reading it in a layout effect keeps the hydration
// render identical to the server HTML, while still applying the cached tabs
// before the browser paints — so the bottom nav appears exactly once with the
// right tabs instead of flickering between guest and host menus.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface TournamentNavCacheState {
  access: TournamentNavAccess | null;
  /** False only during SSR and the hydration render; consumers should hide
   * access-dependent navigation until this is true to avoid tab flicker. */
  ready: boolean;
}

export function useTournamentNavCache(slug: string): TournamentNavCacheState {
  const [state, setState] = useState<TournamentNavCacheState>({
    access: null,
    ready: false,
  });

  useIsomorphicLayoutEffect(() => {
    setState({ access: readTournamentNavCache(slug), ready: true });
  }, [slug]);

  return state;
}
