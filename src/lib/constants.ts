/**
 * Centralized constants for the application
 */
export const REFRESH_INTERVALS = {
  /**
   * Interval for Host/Admin dashboard refresh (1 minute)
   * Higher responsiveness needed for session management.
   */
  HOST: 60,
  /**
   * Interval for Player/Guest activity view (3 minutes)
   * Lower frequency since real-time updates are provided via Socket.io.
   */
  PLAYER: 180,
};
