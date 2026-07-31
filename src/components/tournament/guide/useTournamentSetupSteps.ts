import { useMemo } from 'react';
import { Tournament } from '@/lib/api/types';
import { getPrimaryVenueDisplay } from '@/utils';

export type SetupStepId =
  | 'categories'
  | 'format'
  | 'teams'
  | 'rounds'
  | 'venue'
  | 'schedule'
  | 'publish';

export const SETUP_STEP_IDS: SetupStepId[] = [
  'venue',
  'categories',
  'format',
  'teams',
  'rounds',
  'schedule',
  'publish',
];

export const SETUP_STEP_MANAGE_OPTION: Partial<Record<SetupStepId, string>> = {
  categories: 'categories',
  format: 'format',
  teams: 'teams',
  rounds: 'rounds',
  venue: 'venues',
  schedule: 'schedule',
};

export interface TournamentSetupSteps {
  completionMap: Record<SetupStepId, boolean>;
  completedCount: number;
  totalCount: number;
  isSetupComplete: boolean;
}

// Shared between the dashboard checklist and the floating guide widget so the
// two never disagree about what counts as "done".
export function useTournamentSetupSteps(
  tournament: Tournament
): TournamentSetupSteps {
  const completionMap = useMemo((): Record<SetupStepId, boolean> => {
    const categories = tournament.categories ?? [];
    const hasCategories =
      (tournament._count?.categories ?? categories.length) > 0;
    const teamCount =
      (tournament._count?.players ?? 0) + (tournament._count?.pairs ?? 0);
    // Format is configured once the wizard has written a non-empty
    // formatConfig (same signal FormatPanel uses for its default-format hint)
    const hasFormat =
      categories.length > 0 &&
      categories.every(
        (c) => c.formatConfig && Object.keys(c.formatConfig).length > 0
      );
    const hasRounds =
      categories.length > 0 &&
      categories.every((c) => (c._count?.matches ?? 0) > 0);
    const hasVenue = !!getPrimaryVenueDisplay(tournament);

    return {
      categories: hasCategories,
      format: hasFormat,
      teams: teamCount >= 2,
      rounds: hasRounds,
      venue: hasVenue,
      schedule: (tournament.scheduledMatchesCount ?? 0) > 0,
      publish: tournament.isPublished,
    };
  }, [tournament]);

  const completedCount = useMemo(
    () => SETUP_STEP_IDS.filter((id) => completionMap[id]).length,
    [completionMap]
  );
  const totalCount = SETUP_STEP_IDS.length;

  return {
    completionMap,
    completedCount,
    totalCount,
    isSetupComplete: completedCount === totalCount,
  };
}
