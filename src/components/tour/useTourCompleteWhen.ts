'use client';

import { useEffect } from 'react';
import { useTourStore } from '@/stores/useTourStore';
import { STEP_TO_TOUR, TOURS, TourStepId } from './tourSteps';

/**
 * Marks the given tour step as completed once `condition` becomes true
 * while that step is the active one. No-op for users not in the tour.
 */
export function useTourCompleteWhen(stepId: TourStepId, condition: boolean) {
  const tourId = STEP_TO_TOUR[stepId];

  const isCurrent = useTourStore((s) => {
    const entry = s.tours[tourId];
    if (!entry || entry.status !== 'active') return false;
    return TOURS[tourId].steps[entry.currentStep]?.id === stepId;
  });

  useEffect(() => {
    if (isCurrent && condition) {
      useTourStore.getState().completeStep(tourId, stepId);
    }
  }, [isCurrent, condition, tourId, stepId]);
}
