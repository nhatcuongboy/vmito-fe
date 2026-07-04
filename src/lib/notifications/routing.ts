import { ROUTES } from '@/constants/routes';
import { INotification, UserRole } from '@/lib/api/types';

const getStringData = (
  data: INotification['data'],
  keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
};

export const getNotificationTargetRoute = (
  notification: INotification,
  userRole?: UserRole
): string | null => {
  const type = String(notification.type).toUpperCase();
  const { data } = notification;

  const sessionId = getStringData(data, ['sessionId']);
  const sessionSlug = getStringData(data, ['slug', 'sessionSlug']);
  const clubId = getStringData(data, ['clubSlug', 'clubId']);
  const postId = getStringData(data, ['postId']);

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
