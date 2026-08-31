/** Local source of truth for Classes visibility and route access. */
export const CLASSES_FEATURE_ENABLED = true;

/**
 * Fallback values used only until `useFeatureFlagsStore` finishes loading the
 * live flags from GET /feature-flags (or if that request fails). Class routes
 * intentionally use the standalone constant above instead of this store.
 */
export const FEATURE_FLAG_DEFAULTS = {
  /** Allows PLAYER/REFEREE roles to access HOST features (clubs management,
   *  dashboard, courts, matches, payment tabs, etc.). */
  PLAYER_VIP_ENABLED: true,
  /** If true, "Create Session" buttons open the AI modal by default instead
   *  of navigating directly to the manual creation page. */
  DEFAULT_USE_AI_FOR_CREATION: true,
  /** Controls the shuttlecock-count input and related statistics/export column. */
  SHOW_SHUTTLECOCK_COUNT: false,
  /** Global switch for all AI features (assistant, AI session creation, AI
   *  match analysis, AI-powered court matching). */
  AI_FEATURE_ENABLED: true,
  CLASSES_FEATURE_ENABLED,
} as const;

/** @deprecated Use `CLASSES_FEATURE_ENABLED` for all Classes access checks. */
export const SHOW_CLASSES_BROWSE_MENU = CLASSES_FEATURE_ENABLED;
