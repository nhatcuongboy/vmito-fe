import { AbstractIntlMessages } from 'next-intl';
import { Locale, SUPPORTED_LOCALES } from './locales';

// Namespaces only used within a single route group. They are stripped from the
// global provider in the root layout and re-provided by the route's own layout
// via <ExtendIntlMessages>. Paths are limited to `pages.*` (one level deep).
export const ROUTE_SCOPED_NAMESPACES = [
  'pages.tournaments',
  'pages.guide',
  'pages.about',
  'pages.privacy',
] as const;

export type RouteScopedNamespace = (typeof ROUTE_SCOPED_NAMESPACES)[number];

type Messages = AbstractIntlMessages;

export async function loadMessages(locale: string): Promise<Messages> {
  try {
    if (SUPPORTED_LOCALES.includes(locale as Locale)) {
      return (await import(`./messages/${locale}.json`)).default;
    }
    return (await import(`./messages/${Locale.EN}.json`)).default;
  } catch (error) {
    console.error('Error loading messages:', error);
    try {
      return (await import(`./messages/${Locale.EN}.json`)).default;
    } catch (fallbackError) {
      console.error('Error loading fallback messages:', fallbackError);
      return {};
    }
  }
}

/**
 * Messages for the root layout provider: everything except the
 * route-scoped subtrees, which each route's layout provides itself.
 */
export function getGlobalMessages(all: Messages): Messages {
  const pages = all.pages;
  if (!pages || typeof pages !== 'object') return all;

  const scopedPageKeys = ROUTE_SCOPED_NAMESPACES.map(
    (ns) => ns.split('.')[1] as string
  );
  const trimmedPages: Messages = { ...(pages as Messages) };
  for (const key of scopedPageKeys) {
    delete trimmedPages[key];
  }
  return { ...all, pages: trimmedPages };
}

/**
 * Extracts a single route-scoped subtree, e.g. `pages.tournaments` ->
 * `{ pages: { tournaments: ... } }`, to pass to <ExtendIntlMessages>.
 */
export function pickNamespace(
  all: Messages,
  namespace: RouteScopedNamespace
): Messages {
  const [root, key] = namespace.split('.');
  const rootValue = all[root];
  if (!rootValue || typeof rootValue !== 'object') return {};
  const subtree = (rootValue as Messages)[key];
  if (subtree === undefined) return {};
  return { [root]: { [key]: subtree } };
}
