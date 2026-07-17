import { TournamentProgress } from '@/lib/api/types';

export type RunStepId = 'poolPlay' | 'startPlayoffs' | 'playoffs' | 'finish';

export interface GuideCategoryRow {
  categoryId: string;
  label: string;
  finished: number;
  total: number;
  done: boolean;
}

export interface GuideRunStep {
  id: RunStepId;
  done: boolean;
  rows?: GuideCategoryRow[];
}

/**
 * Derives the run-phase steps from the progress roll-up. Steps that do not
 * apply to the tournament's formats are omitted (e.g. no Pool Play for a
 * knockout-only tournament, no playoff steps for pure round-robins).
 */
export function buildRunSteps(progress: TournamentProgress): GuideRunStep[] {
  const steps: GuideRunStep[] = [];
  const categories = progress.categories;

  const groupCategories = categories.filter((c) => c.groupTotal > 0);
  if (groupCategories.length > 0) {
    const rows = groupCategories.map((c) => ({
      categoryId: c.categoryId,
      label: c.categoryName,
      finished: c.groupFinished,
      total: c.groupTotal,
      done: c.groupFinished === c.groupTotal,
    }));
    steps.push({
      id: 'poolPlay',
      done: rows.every((r) => r.done),
      rows,
    });
  }

  const elimCategories = categories.filter((c) => c.hasEliminationStage);
  if (elimCategories.length > 0) {
    steps.push({
      id: 'startPlayoffs',
      done: elimCategories.every((c) => c.elimGenerated),
    });

    const rows = elimCategories.map((c) => ({
      categoryId: c.categoryId,
      label: c.categoryName,
      finished: c.elimFinished,
      total: c.elimTotal,
      done: c.elimTotal > 0 && c.elimFinished === c.elimTotal,
    }));
    steps.push({
      id: 'playoffs',
      done: rows.every((r) => r.done),
      rows,
    });
  }

  steps.push({
    id: 'finish',
    done: progress.tournamentStatus === 'FINISHED',
  });

  return steps;
}
