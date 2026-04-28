/**
 * Feature flags for the application.
 * Set PLAYER_VIP_ENABLED to true to allow PLAYER role
 * to access all HOST features (clubs management, dashboard,
 * courts, matches, payment tabs, etc.).
 */
export const PLAYER_VIP_ENABLED = true;

/**
 * Default behavior for session creation.
 * If true, "Create Session" buttons will open the AI modal.
 * If false, they will navigate directly to the manual creation page.
 */
export const DEFAULT_USE_AI_FOR_CREATION =
  process.env.NEXT_PUBLIC_DEFAULT_USE_AI_FOR_CREATION === 'false'
    ? false
    : true;
