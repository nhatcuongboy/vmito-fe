export type AiAssistantSuggestionGroup =
  | 'createSession'
  | 'hostSessions'
  | 'payments'
  | 'clubs'
  | 'tournaments'
  | 'venues'
  | 'profile'
  | 'general';

export type AiAssistantPageContextKey =
  | 'createSession'
  | 'hostSessions'
  | 'session'
  | 'clubs'
  | 'tournaments'
  | 'venues'
  | 'profile'
  | 'home';

const normalizePathname = (pathname?: string) => {
  const normalized = (pathname || '/')
    .replace(/^\/(vi|en|cn)(?=\/|$)/, '')
    .replace(/\/$/, '');

  return normalized || '/';
};

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const getAiAssistantSuggestionGroup = (
  pathname?: string
): AiAssistantSuggestionGroup => {
  const normalized = normalizePathname(pathname);

  if (startsWithAny(normalized, ['/sessions/new'])) return 'createSession';
  if (
    startsWithAny(normalized, [
      '/host/payment-settings',
      '/host/transactions',
      '/player/transactions',
    ])
  ) {
    return 'payments';
  }
  if (
    startsWithAny(normalized, [
      '/host/tournaments',
      '/tournaments',
      '/tournament',
    ])
  ) {
    return 'tournaments';
  }
  if (startsWithAny(normalized, ['/host/clubs', '/clubs', '/my-clubs'])) {
    return 'clubs';
  }
  if (startsWithAny(normalized, ['/venues'])) return 'venues';
  if (startsWithAny(normalized, ['/host/sessions', '/sessions'])) {
    return 'hostSessions';
  }
  if (startsWithAny(normalized, ['/user', '/player'])) return 'profile';

  return 'general';
};

export const getAiAssistantPageContextKey = (
  pathname?: string
): AiAssistantPageContextKey => {
  const normalized = normalizePathname(pathname);

  if (startsWithAny(normalized, ['/sessions/new'])) return 'createSession';
  if (startsWithAny(normalized, ['/host/sessions'])) return 'hostSessions';
  if (startsWithAny(normalized, ['/sessions'])) return 'session';
  if (startsWithAny(normalized, ['/host/clubs', '/clubs', '/my-clubs'])) {
    return 'clubs';
  }
  if (
    startsWithAny(normalized, [
      '/host/tournaments',
      '/tournaments',
      '/tournament',
    ])
  ) {
    return 'tournaments';
  }
  if (startsWithAny(normalized, ['/venues'])) return 'venues';
  if (startsWithAny(normalized, ['/user', '/player'])) return 'profile';

  return 'home';
};
