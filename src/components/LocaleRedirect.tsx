'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface LocaleRedirectProps {
  locale: string;
  validLocales: string[];
}

export default function LocaleRedirect({
  locale,
  validLocales,
}: LocaleRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!validLocales.includes(locale)) {
      // Remove the invalid locale and redirect to /vi
      const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '';
      const redirectPath = `/vi${pathWithoutLocale}`;
      router.replace(redirectPath);
    }
  }, [locale, pathname, router, validLocales]);

  // If locale is invalid, don't render anything while redirecting
  if (!validLocales.includes(locale)) {
    return null;
  }

  return null;
}
