import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TOURS,
  TOUR_IDS,
  TourId,
  TourStepId,
} from '@/components/tour/tourSteps';

export type TourStatus = 'idle' | 'active' | 'completed' | 'skipped';

interface TourEntry {
  status: TourStatus;
  currentStep: number;
}

interface TourState {
  tours: Record<TourId, TourEntry>;
  /** The session slug/id currently being walked through (shared context) */
  tourSessionId: string | null;
  _hasHydrated: boolean;

  // Actions
  startTour: (id: TourId) => void;
  completeStep: (
    id: TourId,
    stepId: TourStepId,
    ctx?: { sessionId?: string }
  ) => void;
  skipTour: (id: TourId) => void;
  completeTour: (id: TourId) => void;
  /** Restart the whole journey from the first tour (used by "view tour" CTAs) */
  restartJourney: () => void;
  setTourSessionId: (sessionId: string) => void;
  /** Wipe all tour progress. Called on logout so state doesn't leak to the next user. */
  reset: () => void;
  _setHasHydrated: (value: boolean) => void;
}

const idleTours = (): Record<TourId, TourEntry> =>
  TOUR_IDS.reduce(
    (acc, id) => {
      acc[id] = { status: 'idle', currentStep: 0 };
      return acc;
    },
    {} as Record<TourId, TourEntry>
  );

/** Is any tour currently active? (only one may run at a time) */
const anyActive = (tours: Record<TourId, TourEntry>): boolean =>
  TOUR_IDS.some((id) => tours[id].status === 'active');

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      tours: idleTours(),
      tourSessionId: null,
      _hasHydrated: false,

      startTour: (id) => {
        const { tours } = get();
        // Enforce single-active invariant: don't start over a running tour
        if (anyActive(tours) && tours[id].status !== 'active') return;
        set({
          tours: { ...tours, [id]: { status: 'active', currentStep: 0 } },
        });
      },

      completeStep: (id, stepId, ctx) => {
        const { tours } = get();
        const entry = tours[id];
        if (!entry || entry.status !== 'active') return;

        const steps = TOURS[id].steps;
        if (steps[entry.currentStep]?.id !== stepId) return;

        const next = entry.currentStep + 1;
        const updatedEntry: TourEntry =
          next >= steps.length
            ? { status: 'completed', currentStep: 0 }
            : { status: 'active', currentStep: next };

        set({
          tours: { ...tours, [id]: updatedEntry },
          ...(ctx?.sessionId ? { tourSessionId: ctx.sessionId } : {}),
        });
      },

      skipTour: (id) => {
        const { tours } = get();
        set({
          tours: { ...tours, [id]: { status: 'skipped', currentStep: 0 } },
        });
      },

      completeTour: (id) => {
        const { tours } = get();
        set({
          tours: { ...tours, [id]: { status: 'completed', currentStep: 0 } },
        });
      },

      restartJourney: () => {
        const fresh = idleTours();
        const firstTour = TOUR_IDS[0];
        fresh[firstTour] = { status: 'active', currentStep: 0 };
        set({ tours: fresh, tourSessionId: null });
      },

      setTourSessionId: (sessionId) => set({ tourSessionId: sessionId }),

      reset: () => set({ tours: idleTours(), tourSessionId: null }),

      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'product-tour',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tours: state.tours,
        tourSessionId: state.tourSessionId,
      }),
      migrate: (persisted, version) => {
        // v0 shape: { status, currentStep, tourSessionId } — a single 12-step tour.
        // Map onto the two split tours so returning users aren't re-prompted.
        if (version === 0 && persisted && typeof persisted === 'object') {
          const old = persisted as {
            status?: TourStatus;
            currentStep?: number;
            tourSessionId?: string | null;
          };
          const tours = idleTours();
          const create = 'create-session-tour' as TourId;
          const run = 'run-matches-tour' as TourId;
          const oldStep = old.currentStep ?? 0;

          if (old.status === 'completed') {
            tours[create] = { status: 'completed', currentStep: 0 };
            tours[run] = { status: 'completed', currentStep: 0 };
          } else if (old.status === 'skipped') {
            tours[create] = { status: 'skipped', currentStep: 0 };
            tours[run] = { status: 'skipped', currentStep: 0 };
          } else if (old.status === 'active') {
            // Old 12-step tour indices:
            //   0 create,1 submit,2 manage,3 players-tab,4 add-player,
            //   5 open-overview,6 start-session,7 courts-tab,8 assign,
            //   9 start-match,10 end-match,11 done
            // New create tour owns 0..4; the rest map onto the run tour, whose
            // step 0 is open-overview → old step 5 = run step 0.
            if (oldStep <= 4) {
              tours[create] = { status: 'active', currentStep: oldStep };
            } else {
              tours[create] = { status: 'completed', currentStep: 0 };
              // run tour has 7 steps (0..6); clamp active step to end-match (5)
              const runStep = Math.min(Math.max(oldStep - 5, 0), 5);
              tours[run] = { status: 'active', currentStep: runStep };
            }
          }
          return {
            tours,
            tourSessionId: old.tourSessionId ?? null,
          };
        }
        return persisted as Partial<TourState>;
      },
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    }
  )
);
