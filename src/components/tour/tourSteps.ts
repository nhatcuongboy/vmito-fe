export type TourId = 'create-session-tour' | 'run-matches-tour';

export type TourStepId =
  // create-session-tour
  | 'create-session'
  | 'submit-session'
  | 'manage-session'
  | 'open-players-tab'
  | 'add-player'
  | 'done-create'
  // run-matches-tour
  | 'open-overview-tab'
  | 'start-session'
  | 'open-courts-tab'
  | 'assign-players'
  | 'start-match'
  | 'end-match'
  | 'done-run';

export interface TourStepDef {
  id: TourStepId;
  /** Key under <namespace>.steps.* in the i18n messages */
  i18nKey: string;
  /** Matched against the locale-stripped pathname; null = any page */
  route: RegExp | null;
  /** Required ?tab= value on the session detail page; undefined = any tab */
  tab?: number;
  /** Selector fallback list — first found wins. Empty = element-less popover */
  selectors: string[];
  /** Step opens a modal: destroy the overlay when the element is clicked */
  hidesOnClick?: boolean;
  /**
   * The anchor button can be disabled (e.g. not enough waiting players to
   * assign). When disabled, show the step's `<key>.disabledTitle` /
   * `.disabledDescription` copy instead of the normal instruction.
   */
  disabledHint?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * The controller advances this step automatically once the URL matches.
   * Declarative replacement for the old shouldAutoAdvance switch.
   */
  advanceWhen?: { pathname: RegExp; tab?: number };
}

export interface TourDefinition {
  id: TourId;
  /** i18n namespace under productTour.tours.* */
  i18nNamespace: string;
  steps: TourStepDef[];
}

/**
 * Session management route (tabbed hub). Hosts land on /host/sessions/[id];
 * PLAYER/REFEREE-role owners land on /player/sessions/[id]. Excludes the
 * static list routes living under the same prefixes.
 */
export const SESSION_DETAIL_RE =
  /^\/(?:host|player)\/sessions\/(?!joined$|ended$|pending$|join$)[^/]+$/;

/** Public session detail page shown right after creating a session */
export const PUBLIC_SESSION_DETAIL_RE = /^\/sessions\/(?!new$)[^/]+$/;

const NEW_SESSION_RE = /^\/sessions\/new$/;

export const TOURS: Record<TourId, TourDefinition> = {
  'create-session-tour': {
    id: 'create-session-tour',
    i18nNamespace: 'createSession',
    steps: [
      {
        id: 'create-session',
        i18nKey: 'createSession',
        route: null,
        selectors: ['[data-tour="create-session"]'],
        hidesOnClick: true,
        side: 'top',
        advanceWhen: { pathname: NEW_SESSION_RE },
      },
      {
        id: 'submit-session',
        i18nKey: 'submitSession',
        route: NEW_SESSION_RE,
        selectors: ['[data-tour="submit-session"]'],
        side: 'top',
        // onSuccess instrumentation completes this; URL match is the safety net
        advanceWhen: { pathname: PUBLIC_SESSION_DETAIL_RE },
      },
      {
        id: 'manage-session',
        i18nKey: 'manageSession',
        route: PUBLIC_SESSION_DETAIL_RE,
        selectors: ['[data-tour="manage-session"]'],
        side: 'top',
        advanceWhen: { pathname: SESSION_DETAIL_RE },
      },
      {
        id: 'open-players-tab',
        i18nKey: 'openPlayersTab',
        route: SESSION_DETAIL_RE,
        selectors: ['[data-tour="session-tab-players"]'],
        side: 'top',
        advanceWhen: { pathname: SESSION_DETAIL_RE, tab: 1 },
      },
      {
        id: 'add-player',
        i18nKey: 'addPlayer',
        route: SESSION_DETAIL_RE,
        tab: 1,
        selectors: ['[data-tour="add-player"]'],
        hidesOnClick: true,
        side: 'bottom',
      },
      {
        id: 'done-create',
        i18nKey: 'doneCreate',
        route: null,
        selectors: [],
      },
    ],
  },
  'run-matches-tour': {
    id: 'run-matches-tour',
    i18nNamespace: 'runMatches',
    steps: [
      {
        id: 'open-overview-tab',
        i18nKey: 'openOverviewTab',
        route: SESSION_DETAIL_RE,
        selectors: ['[data-tour="session-tab-overview"]'],
        side: 'top',
        // Auto-advances instantly if already on the Overview tab (default),
        // otherwise guides a user sitting on another tab back to it.
        advanceWhen: { pathname: SESSION_DETAIL_RE, tab: 0 },
      },
      {
        id: 'start-session',
        i18nKey: 'startSession',
        route: SESSION_DETAIL_RE,
        tab: 0,
        selectors: ['[data-tour="start-session"]'],
        side: 'top',
      },
      {
        id: 'open-courts-tab',
        i18nKey: 'openCourtsTab',
        route: SESSION_DETAIL_RE,
        selectors: ['[data-tour="session-tab-courts"]'],
        side: 'top',
        advanceWhen: { pathname: SESSION_DETAIL_RE, tab: 2 },
      },
      {
        id: 'assign-players',
        i18nKey: 'assignPlayers',
        route: SESSION_DETAIL_RE,
        tab: 2,
        selectors: ['[data-tour="assign-players"]'],
        hidesOnClick: true,
        disabledHint: true,
        side: 'bottom',
      },
      {
        id: 'start-match',
        i18nKey: 'startMatch',
        route: SESSION_DETAIL_RE,
        tab: 2,
        selectors: ['[data-tour="start-match"]'],
        side: 'bottom',
      },
      {
        id: 'end-match',
        i18nKey: 'endMatch',
        route: SESSION_DETAIL_RE,
        tab: 2,
        selectors: ['[data-tour="end-match"]'],
        hidesOnClick: true,
        side: 'bottom',
      },
      {
        id: 'done-run',
        i18nKey: 'doneRun',
        route: null,
        selectors: [],
      },
    ],
  },
};

export const TOUR_IDS = Object.keys(TOURS) as TourId[];

/** Reverse lookup: which tour a given step belongs to */
export const STEP_TO_TOUR: Record<TourStepId, TourId> = TOUR_IDS.reduce(
  (acc, tourId) => {
    for (const step of TOURS[tourId].steps) acc[step.id] = tourId;
    return acc;
  },
  {} as Record<TourStepId, TourId>
);

export const stepIndexOf = (tourId: TourId, stepId: TourStepId): number =>
  TOURS[tourId].steps.findIndex((s) => s.id === stepId);
