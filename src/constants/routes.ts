/**
 * Application Routes Configuration
 * Central management of all pages and routes in the application
 */

// ==================== MAIN ROUTES ====================
export const ROUTES = {
  // Root
  HOME: '/',
  DASHBOARD: '/dashboard',
  NEWSFEED: '/newsfeed',
  NEWSFEED_POST: (postId: string) => `/newsfeed/${postId}`,

  // Authentication
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CALLBACK: '/auth/callback',
  },

  // Sessions - Generic/Shared
  SESSIONS: {
    NEW: '/sessions/new',
    DETAIL: (id: string, slug?: string) => `/sessions/${slug || id}`,
  },

  // Host Routes
  HOST: {
    SESSIONS: {
      LIST: '/host/sessions',
      ENDED: '/host/sessions/ended',
      DETAIL: (id: string, slug?: string) => `/host/sessions/${slug || id}`,
      PLAYERS: (id: string, slug?: string) =>
        `/host/sessions/${slug || id}?tab=1`,
    },
    TRANSACTIONS: '/host/transactions',
    PAYMENT_SETTINGS: '/host/payment-settings',
    CLUBS: {
      LIST: '/host/clubs',
      CREATE: '/host/clubs/create',
      DETAIL: (id: string) => `/host/clubs/${id}`,
      EDIT: (id: string) => `/host/clubs/${id}/edit`,
      MEMBERS: (id: string) => `/host/clubs/${id}/members`,
      FEES: (id: string) => `/host/clubs/${id}/fees`,
    },
    PENDING_JOIN_REQUESTS: '/host/sessions/pending',
    APPROVAL: {
      SESSION_REQUEST: (sessionId: string, playerId: string) =>
        `/host/approval/${sessionId}/${playerId}`,
      CLUB_REQUEST: (clubId: string, requestId: string) =>
        `/host/club-requests/${clubId}/${requestId}`,
    },
    TOURNAMENTS: {
      LIST: '/host/tournaments',
      NEW: '/host/tournaments/new',
      DETAIL: (id: string) => `/host/tournaments/${id}`,
      PLAYERS: (id: string) => `/host/tournaments/${id}/players`,
      PAIRS: (id: string) => `/host/tournaments/${id}/pairs`,
      CATEGORIES: {
        DETAIL: (id: string, categoryId: string) =>
          `/host/tournaments/${id}/categories/${categoryId}`,
      },
    },
  },

  // Player Routes
  PLAYER: {
    HOST_FEATURE: '/host/sessions',
    SUGGESTIONS: '/player/suggestions',
    SESSIONS: {
      LIST: '/host/sessions/joined',
      ENDED: '/host/sessions/joined/ended',
      DETAIL: (id: string, slug?: string) => `/player/sessions/${slug || id}`,
      JOIN_CONFIRM: '/player/sessions/join/confirm',
    },
    TRANSACTIONS: '/player/transactions',
    PROFILE: (playerId: string) => `/player/${playerId}`,
  },

  // Venues
  VENUES: {
    DETAIL: (id: string, slug?: string) => `/venues/${slug || id}`,
  },

  // Browse/Public Routes
  BROWSE: {
    VENUES: {
      LIST: '/venues',
    },
    SESSIONS: {
      DETAIL: (id: string, slug?: string) => `/browse/sessions/${slug || id}`,
      JOIN: (id: string) => `/browse/sessions/${id}/join`,
    },
    TOURNAMENTS: {
      LIST: '/tournaments',
      DETAIL: (id: string) => `/tournament/${id}`,
      MATCHES: (id: string) => `/tournament/${id}/schedule`,
      PLAYERS: (id: string) => `/tournament/${id}/teams`,
      PLAYER_DETAIL: (id: string, _playerId: string) =>
        `/tournament/${id}/teams`,
      EVENTS: (id: string) => `/tournament/${id}`,
      WINNERS: (id: string) => `/tournament/${id}/standings`,
      CATEGORIES: {
        DETAIL: (id: string, _categoryId: string) => `/tournament/${id}`,
      },
      MANAGE: {
        HUB: (id: string) => `/tournament/${id}/manage`,
        PLAYERS: (id: string) => `/tournament/${id}/manage?option=players`,
        PAIRS: (id: string) => `/tournament/${id}/manage?option=pairs`,
        CATEGORIES: {
          DETAIL: (id: string, _categoryId: string) =>
            `/tournament/${id}/manage?option=categories`,
        },
      },
    },
  },

  // Tournament Routes (New)
  TOURNAMENT: {
    DETAIL: (id: string) => `/tournament/${id}`,
    TEAMS: (id: string) => `/tournament/${id}/teams`,
    SCHEDULE: (id: string) => `/tournament/${id}/schedule`,
    STANDINGS: (id: string) => `/tournament/${id}/standings`,
    MANAGE: (id: string) => `/tournament/${id}/manage`,
    DASHBOARD: (id: string) => `/tournament/${id}/dashboard`,
  },

  // Clubs Routes
  CLUBS: {
    BROWSE: '/clubs',
    DETAIL: (id: string) => `/clubs/${id}`,
    MY_CLUBS: '/my-clubs',
  },

  // Join Routes
  JOIN: {
    ENTRY: '/join',
    REGISTER: '/join/register',
    CONFIRM: '/join/confirm',
    STATUS: '/join/status',
    BY_CODE: '/join-by-code',
  },

  // Guest Routes
  GUEST: {
    SESSION: '/guest/session',
    JOIN_STATUS: '/guest/join/status',
  },

  // Admin Routes
  ADMIN: {
    USERS: '/admin/users',
    NOTIFICATIONS: '/admin/notifications',
    FEEDBACK: '/admin/feedback',
    GENERAL: '/admin/general',
    LEVEL_DESCRIPTIONS: '/admin/level-descriptions',
    VENUES: '/admin/venues',
    VENUE_REQUESTS: '/admin/venues/requests',
    VENUE_REQUEST_DETAIL: (requestId: string) =>
      `/admin/venues/requests/${requestId}`,
    CLUBS: '/admin/clubs/pending',
  },

  // User Public Profile
  USER: {
    PROFILE: (userId: string) => `/user/${userId}`,
  },

  // Settings & Profile
  SETTINGS: '/settings',
  PLAYER_STATUS: '/player-status',
  ABOUT: '/about',
  GUIDE: '/guide',
  FEEDBACK: '/feedback',
} as const;

// ==================== ROUTE GROUPS ====================
/**
 * Grouped routes for easier organization
 * Useful for navigation menus, breadcrumbs, etc.
 */
export const ROUTE_GROUPS = {
  // Routes that require authentication
  PROTECTED: [
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.HOST.TRANSACTIONS,
    ROUTES.HOST.PAYMENT_SETTINGS,
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.PLAYER.SESSIONS.LIST,
    ROUTES.PLAYER.TRANSACTIONS,
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.NOTIFICATIONS,
    ROUTES.ADMIN.FEEDBACK,
    ROUTES.ADMIN.GENERAL,
    ROUTES.ADMIN.LEVEL_DESCRIPTIONS,
    ROUTES.ADMIN.CLUBS,
    ROUTES.SETTINGS,
    ROUTES.FEEDBACK,
  ],

  // Public routes
  PUBLIC: [
    ROUTES.HOME,
    ROUTES.AUTH.SIGNIN,
    ROUTES.AUTH.SIGNUP,
    ROUTES.AUTH.FORGOT_PASSWORD,
    ROUTES.AUTH.RESET_PASSWORD,
    ROUTES.JOIN.ENTRY,
    ROUTES.JOIN.REGISTER,
    ROUTES.JOIN.BY_CODE,
    ROUTES.BROWSE.TOURNAMENTS.LIST,
    ROUTES.BROWSE.VENUES.LIST,
    ROUTES.ABOUT,
    ROUTES.GUIDE,
  ],

  // Host-only routes
  HOST_ONLY: [
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.HOST.TRANSACTIONS,
    ROUTES.HOST.PAYMENT_SETTINGS,
  ],

  // Player-only routes
  PLAYER_ONLY: [ROUTES.PLAYER.SESSIONS.LIST, ROUTES.PLAYER.TRANSACTIONS],

  // Admin-only routes
  ADMIN_ONLY: [
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.NOTIFICATIONS,
    ROUTES.ADMIN.FEEDBACK,
    ROUTES.ADMIN.LEVEL_DESCRIPTIONS,
    ROUTES.ADMIN.CLUBS,
  ],

  // Main navigation items
  MAIN_NAV: [ROUTES.HOME, ROUTES.BROWSE.TOURNAMENTS.LIST, ROUTES.SETTINGS],

  // Session-related routes
  SESSION_ROUTES: [
    ROUTES.SESSIONS.NEW,
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.PLAYER.SESSIONS.LIST,
    ROUTES.BROWSE.SESSIONS.DETAIL(''),
  ],

  // Tournament-related routes
  TOURNAMENT_ROUTES: [
    ROUTES.HOST.TOURNAMENTS.NEW,
    ROUTES.BROWSE.TOURNAMENTS.LIST,
    ROUTES.BROWSE.TOURNAMENTS.DETAIL(''),
  ],
} as const;

// ==================== ROUTE HELPERS ====================
/**
 * Helper functions for route management
 */
export const routeHelpers = {
  /**
   * Check if a route is protected (requires authentication)
   */
  isProtected: (pathname: string): boolean => {
    return ROUTE_GROUPS.PROTECTED.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(route.replace(/\/$/, '') + '/')
    );
  },

  /**
   * Check if a route is a public route
   */
  isPublic: (pathname: string): boolean => {
    return ROUTE_GROUPS.PUBLIC.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(route.replace(/\/$/, '') + '/')
    );
  },

  /**
   * Check if a route is host-only
   */
  isHostOnly: (pathname: string): boolean => {
    return pathname.startsWith('/host/');
  },

  /**
   * Check if a route is player-only
   */
  isPlayerOnly: (pathname: string): boolean => {
    return pathname.startsWith('/player/');
  },

  /**
   * Check if a route is admin-only
   */
  isAdminOnly: (pathname: string): boolean => {
    return pathname.startsWith('/admin/');
  },

  /**
   * Get the base route from a detailed route
   * Example: '/host/sessions/123' -> '/host/sessions'
   */
  getBaseRoute: (pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return `/${segments[0]}`;
    if (segments.length === 2) return `/${segments.join('/')}`;
    // For routes like /host/sessions/123, return /host/sessions
    return `/${segments.slice(0, 2).join('/')}`;
  },
};

// ==================== BREADCRUMB CONFIG ====================
/**
 * Configuration for breadcrumb navigation
 * Maps routes to their display names
 */
export const BREADCRUMB_LABELS: Record<string, string> = {
  [ROUTES.HOME]: 'Home',
  [ROUTES.AUTH.SIGNIN]: 'Sign In',
  [ROUTES.AUTH.SIGNUP]: 'Sign Up',
  [ROUTES.AUTH.FORGOT_PASSWORD]: 'Forgot Password',
  [ROUTES.AUTH.RESET_PASSWORD]: 'Reset Password',
  [ROUTES.HOST.SESSIONS.LIST]: 'My Sessions',
  [ROUTES.HOST.TRANSACTIONS]: 'Transactions',
  [ROUTES.HOST.PAYMENT_SETTINGS]: 'Payment Settings',
  [ROUTES.HOST.PENDING_JOIN_REQUESTS]: 'Pending Join Requests',

  [ROUTES.PLAYER.SESSIONS.LIST]: 'My Sessions',
  [ROUTES.PLAYER.TRANSACTIONS]: 'Transactions',
  [ROUTES.BROWSE.TOURNAMENTS.LIST]: 'Browse Tournaments',
  [ROUTES.SETTINGS]: 'Settings',
  [ROUTES.ABOUT]: 'About',
  [ROUTES.GUIDE]: 'User Guide',
  [ROUTES.FEEDBACK]: 'Contact & Bug Report',
  [ROUTES.ADMIN.USERS]: 'Users',
  [ROUTES.ADMIN.NOTIFICATIONS]: 'Notifications',
  [ROUTES.ADMIN.FEEDBACK]: 'Feedback',
  [ROUTES.ADMIN.LEVEL_DESCRIPTIONS]: 'Level Descriptions',
  [ROUTES.ADMIN.CLUBS]: 'Club Approval',
};

// ==================== REDIRECT MAPPINGS ====================
/**
 * Old routes that should redirect to new routes
 * Used in middleware for backward compatibility
 */
export const ROUTE_REDIRECTS: Record<string, string> = {
  '/my-session': ROUTES.GUEST.SESSION,
  '/join/confirm': ROUTES.PLAYER.SESSIONS.JOIN_CONFIRM,
  '/join/status': ROUTES.GUEST.JOIN_STATUS,
  '/sessions/find': ROUTES.BROWSE.TOURNAMENTS.LIST,
  '/tournaments': ROUTES.BROWSE.TOURNAMENTS.LIST,
  '/tournaments/new': ROUTES.HOST.TOURNAMENTS.NEW,
  '/browse/tournaments/:id(.*)': '/tournament/:id$1',
  '/browse/venues': ROUTES.BROWSE.VENUES.LIST,
  '/browse/tournaments': ROUTES.BROWSE.TOURNAMENTS.LIST,
} as const;

// ==================== LOCALE ROUTES ====================
/**
 * Routes with locale prefix
 * These are helper functions to generate locale-prefixed routes
 */
export const withLocale = (locale: string, path: string): string => {
  return `/${locale}${path}`;
};

/**
 * Remove locale prefix from a path
 * Example: '/en/dashboard' -> '/dashboard'
 */
export const removeLocale = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  // If first segment looks like a locale (2-2 chars), remove it
  if (segments[0]?.length <= 2) {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
};

// ==================== EXPORT TYPES ====================
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
