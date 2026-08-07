/**
 * Fallback values used only until `useFeatureFlagsStore` finishes loading the
 * live flags from GET /feature-flags (or if that request fails). The source
 * of truth is now the `feature_flags` DB table on the backend, not this file
 * — update flag values there, not here.
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
  /** Controls visibility and access to the Classes feature (menus, creation, editing, browsing). */
  CLASSES_FEATURE_ENABLED: false,
} as const;
