'use client';

import { useEffect } from 'react';
import { useTourStore } from '@/stores/useTourStore';
import { TOUR_IDS, TourId } from './tourSteps';

/**
 * Auto-starts the given tour once `condition` becomes true, provided the tour
 * is still idle and no other tour is currently running (single-active
 * invariant). No-op after the tour has started, completed, or been skipped.
 */
export function useTourAutoStart(tourId: TourId, condition: boolean) {
  const shouldStart = useTourStore((s) => {
    if (!s._hasHydrated) return false;
    if (s.tours[tourId]?.status !== 'idle') return false;
    // Don't interrupt another running tour
    return !TOUR_IDS.some((id) => s.tours[id]?.status === 'active');
  });

  useEffect(() => {
    if (shouldStart && condition) {
      useTourStore.getState().startTour(tourId);
    }
  }, [shouldStart, condition, tourId]);
}
