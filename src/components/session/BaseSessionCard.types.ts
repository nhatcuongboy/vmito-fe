/**
 * Configuration interface for session card action buttons
 * Used to declaratively configure which action buttons to display
 * and how they should behave
 */
export interface SessionActionConfig {
  // Top action buttons (icon buttons)
  /**
   * Show phone call button (only if session has hostPhone)
   * Triggers tel: protocol to call host
   */
  showCallButton?: boolean;

  /**
   * Show download button (only for session owner)
   * Downloads session card as PNG image
   */
  showDownloadButton?: boolean;

  /**
   * Show share button (always available)
   * Uses native share API or clipboard fallback
   */
  showShareButton?: boolean;

  // Bottom action buttons - Left side
  /**
   * Show delete button (only for session owner)
   * Triggers delete confirmation modal
   */
  showDeleteButton?: boolean;

  /**
   * Callback when delete button is clicked
   * @param sessionId - ID of the session to delete
   */
  onDelete?: (sessionId: string) => void;

  // Bottom action buttons - Right side
  /**
   * Show manage button (for session owner)
   * Routes to host or player manage page based on role
   */
  showManageButton?: boolean;

  /**
   * Custom href for manage button
   * Auto-computed based on user role if not provided
   */
  manageButtonHref?: string;

  /**
   * Show "View Session" button (for approved players)
   * Routes to player session detail page
   * Default href: /player/sessions/{id}
   */
  showViewSessionButton?: boolean;

  /**
   * Custom href for view session button
   * @default /player/sessions/{id}
   */
  viewSessionHref?: string;

  /**
   * Show "View Registration" button (for players with pending/rejected registration)
   * Triggers modal to view registration details
   */
  showViewRegistrationButton?: boolean;

  /**
   * Callback when view registration button is clicked
   * Should open a modal showing registration details
   */
  onViewRegistration?: () => void;

  /**
   * Show register button (for non-registered users)
   * Can be disabled if session is full
   */
  showRegisterButton?: boolean;

  /**
   * Callback when register button is clicked
   * Should handle registration flow (auth check + registration)
   */
  onRegister?: () => void;

  /**
   * Disable register button (typically when session is full)
   */
  registerButtonDisabled?: boolean;
  /**
   * Status of registration status fetching for current user
   */
  isRegistrationLoading?: boolean;
}
