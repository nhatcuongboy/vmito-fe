import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { Locale, SUPPORTED_LOCALES } from './locales';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: [...SUPPORTED_LOCALES],

  // Used when no locale matches
  defaultLocale:
    (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || Locale.VI,

  // The locale prefix strategy - always show locale in URL
  localePrefix: 'always',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
