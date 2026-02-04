/**
 * Application Routes Configuration
 * Central management of all pages and routes in the application
 */

// ==================== MAIN ROUTES ====================
export const ROUTES = {
  // Root
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Authentication
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    CALLBACK: '/auth/callback',
  },

  // Sessions - Generic/Shared
  SESSIONS: {
    NEW: '/sessions/new',
    DETAIL: (id: string) => `/sessions/${id}`,
  },

  // Host Routes
  HOST: {
    DASHBOARD: '/host/dashboard',
    SESSIONS: {
      LIST: '/host/sessions',
      DETAIL: (id: string) => `/host/sessions/${id}`,
    },
    TRANSACTIONS: '/host/transactions',
    PAYMENT_SETTINGS: '/host/payment-settings',
    TOURNAMENTS: {
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
    DASHBOARD: '/player/dashboard',
    HOST_FEATURE: '/player/host',
    SESSIONS: {
      LIST: '/player/sessions',
      DETAIL: (id: string) => `/player/sessions/${id}`,
      JOIN_CONFIRM: '/player/sessions/join/confirm',
    },
    TRANSACTIONS: '/player/transactions',
    PROFILE: (playerId: string) => `/player/${playerId}`,
  },

  // Browse/Public Routes
  BROWSE: {
    SESSIONS: {
      DETAIL: (id: string) => `/browse/sessions/${id}`,
      JOIN: (id: string) => `/browse/sessions/${id}/join`,
    },
    TOURNAMENTS: {
      LIST: '/browse/tournaments',
      DETAIL: (id: string) => `/browse/tournaments/${id}`,
      MATCHES: (id: string) => `/browse/tournaments/${id}/matches`,
      PLAYERS: (id: string) => `/browse/tournaments/${id}/players`,
      PLAYER_DETAIL: (id: string, playerId: string) =>
        `/browse/tournaments/${id}/players/${playerId}`,
      EVENTS: (id: string) => `/browse/tournaments/${id}/events`,
      WINNERS: (id: string) => `/browse/tournaments/${id}/winners`,
      CATEGORIES: {
        DETAIL: (id: string, categoryId: string) =>
          `/browse/tournaments/${id}/categories/${categoryId}`,
      },
      MANAGE: {
        HUB: (id: string) => `/browse/tournaments/${id}/manage`,
        PLAYERS: (id: string) => `/browse/tournaments/${id}/manage/players`,
        PAIRS: (id: string) => `/browse/tournaments/${id}/manage/pairs`,
        CATEGORIES: {
          DETAIL: (id: string, categoryId: string) =>
            `/browse/tournaments/${id}/manage/categories/${categoryId}`,
        },
      },
    },
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
  },

  // Settings & Profile
  SETTINGS: '/settings',
  PLAYER_STATUS: '/player-status',
  ABOUT: '/about',
} as const;

// ==================== ROUTE GROUPS ====================
/**
 * Grouped routes for easier organization
 * Useful for navigation menus, breadcrumbs, etc.
 */
export const ROUTE_GROUPS = {
  // Routes that require authentication
  PROTECTED: [
    ROUTES.HOST.DASHBOARD,
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.HOST.TRANSACTIONS,
    ROUTES.HOST.PAYMENT_SETTINGS,
    ROUTES.PLAYER.DASHBOARD,
    ROUTES.PLAYER.HOST_FEATURE,
    ROUTES.PLAYER.SESSIONS.LIST,
    ROUTES.PLAYER.TRANSACTIONS,
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.NOTIFICATIONS,
    ROUTES.SETTINGS,
  ],

  // Public routes
  PUBLIC: [
    ROUTES.HOME,
    ROUTES.AUTH.SIGNIN,
    ROUTES.AUTH.SIGNUP,
    ROUTES.JOIN.ENTRY,
    ROUTES.JOIN.REGISTER,
    ROUTES.JOIN.BY_CODE,
    ROUTES.BROWSE.TOURNAMENTS.LIST,
    ROUTES.ABOUT,
  ],

  // Host-only routes
  HOST_ONLY: [
    ROUTES.HOST.DASHBOARD,
    ROUTES.HOST.SESSIONS.LIST,
    ROUTES.HOST.TRANSACTIONS,
    ROUTES.HOST.PAYMENT_SETTINGS,
  ],

  // Player-only routes
  PLAYER_ONLY: [
    ROUTES.PLAYER.DASHBOARD,
    ROUTES.PLAYER.HOST_FEATURE,
    ROUTES.PLAYER.SESSIONS.LIST,
    ROUTES.PLAYER.TRANSACTIONS,
  ],

  // Admin-only routes
  ADMIN_ONLY: [ROUTES.ADMIN.USERS, ROUTES.ADMIN.NOTIFICATIONS],

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
  [ROUTES.HOST.DASHBOARD]: 'Host Dashboard',
  [ROUTES.HOST.SESSIONS.LIST]: 'My Sessions',
  [ROUTES.HOST.TRANSACTIONS]: 'Transactions',
  [ROUTES.HOST.PAYMENT_SETTINGS]: 'Payment Settings',
  [ROUTES.PLAYER.DASHBOARD]: 'Player Dashboard',
  [ROUTES.PLAYER.HOST_FEATURE]: 'Become a Host',
  [ROUTES.PLAYER.SESSIONS.LIST]: 'My Sessions',
  [ROUTES.PLAYER.TRANSACTIONS]: 'Transactions',
  [ROUTES.BROWSE.TOURNAMENTS.LIST]: 'Browse Tournaments',
  [ROUTES.SETTINGS]: 'Settings',
  [ROUTES.ABOUT]: 'About',
  [ROUTES.ADMIN.USERS]: 'Users',
  [ROUTES.ADMIN.NOTIFICATIONS]: 'Notifications',
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
