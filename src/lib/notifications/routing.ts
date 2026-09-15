import { ROUTES } from '@/constants/routes';
import { INotification, UserRole } from '@/lib/api/types';
import { SUPPORTED_LOCALES } from '@/i18n/locales';

const getStringData = (
  data: INotification['data'],
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

export const stripLocalePrefix = (path: string): string => {
  for (const locale of SUPPORTED_LOCALES) {
    if (path === `/${locale}`) {
      return '/';
    }
    if (path.startsWith(`/${locale}/`)) {
      return path.slice(locale.length + 1);
    }
  }
  return path;
};

export const navigateToNotificationUrl = (
  url: string,
  router: { push: (href: string) => void }
): void => {
  if (!url) return;

  const trimmed = url.trim();

  // If absolute URL with http:// or https://
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const isSameOrigin =
        typeof window !== 'undefined' &&
        (parsed.origin === window.location.origin ||
          parsed.hostname === 'vmito.com' ||
          parsed.hostname.endsWith('.vmito.com') ||
          parsed.hostname === 'localhost');

      if (isSameOrigin) {
        const path =
          stripLocalePrefix(parsed.pathname) + parsed.search + parsed.hash;
        router.push(path || '/');
        return;
      }
    } catch {
      // Fallback to window.open if parsing fails
    }

    if (typeof window !== 'undefined') {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  // Relative path
  const normalized = stripLocalePrefix(trimmed);
  router.push(normalized.startsWith('/') ? normalized : `/${normalized}`);
};

export const getNotificationTargetRoute = (
  notification: INotification,
  userRole?: UserRole
): string | null => {
  const type = String(notification.type).toUpperCase();
  const { data } = notification;

  const explicitLink = getStringData(data, ['link', 'url']);

  if (explicitLink) {
    return explicitLink;
  }

  const action = getStringData(data, ['action']);

  const sessionId = getStringData(data, ['sessionId']);
  const sessionSlug = getStringData(data, ['slug', 'sessionSlug']);
  const clubId = getStringData(data, ['clubSlug', 'clubId']);
  const tournamentId = getStringData(data, ['tournamentSlug', 'tournamentId']);
  const postId = getStringData(data, ['postId']);
  const rentalRequestId = getStringData(data, ['rentalRequestId']);
  const venueId = getStringData(data, ['venueSlug', 'venueId', 'id']);

  if (action === 'session_favorited' && sessionId) {
    return ROUTES.SESSIONS.DETAIL(sessionId, sessionSlug);
  }

  if (action === 'club_favorited' && clubId) {
    return ROUTES.CLUBS.DETAIL(clubId);
  }

  if (action === 'tournament_favorited' && tournamentId) {
    return ROUTES.TOURNAMENT.DETAIL(tournamentId);
  }

  if (type === 'VENUE_REQUEST' || action?.startsWith('venue_request_')) {
    if (venueId) {
      return `/venues/${venueId}`;
    }
    return '/venues';
  }

  if (type === 'VENUE_RENTAL' && rentalRequestId) {
    const detailRoute =
      data?.manage === true
        ? `/manage/venues/rentals/${rentalRequestId}`
        : `/my/rentals/${rentalRequestId}`;
    return data?.route === 'rental-payment'
      ? `${detailRoute}#rental-payment`
      : detailRoute;
  }

  if (type === 'PAYMENT' && data?.route === 'reminders') {
    return ROUTES.REMINDERS;
  }

  if (type === 'POST' && postId) {
    return ROUTES.NEWSFEED_POST(postId);
  }

  if ((type === 'SESSION' || type === 'REGISTRATION') && sessionId) {
    return userRole === UserRole.HOST
      ? ROUTES.HOST.SESSIONS.DETAIL(sessionId, sessionSlug)
      : ROUTES.PLAYER.SESSIONS.DETAIL(sessionId, sessionSlug);
  }

  if (type === 'CLUB' && clubId) {
    return userRole === UserRole.HOST
      ? ROUTES.HOST.CLUBS.EDIT(clubId)
      : ROUTES.CLUBS.DETAIL(clubId);
  }

  if (sessionId) {
    return userRole === UserRole.HOST
      ? ROUTES.HOST.SESSIONS.DETAIL(sessionId, sessionSlug)
      : ROUTES.PLAYER.SESSIONS.DETAIL(sessionId, sessionSlug);
  }

  if (clubId) {
    return ROUTES.CLUBS.DETAIL(clubId);
  }

  return null;
};
