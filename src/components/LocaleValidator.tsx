'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface LocaleValidatorProps {
  locale: string;
  validLocales: string[];
}

export default function LocaleValidator({
  locale,
  validLocales,
}: LocaleValidatorProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!validLocales.includes(locale)) {
      // Extract the path after the invalid locale
      const pathParts = pathname.split('/');
      const pathWithoutLocale = pathParts.slice(2).join('/'); // Remove first empty and locale
      const redirectPath = pathWithoutLocale
        ? `/vi/${pathWithoutLocale}`
        : '/vi';

      router.replace(redirectPath);
    }
  }, [locale, pathname, router, validLocales]);

  // Don't render anything if locale is invalid
  if (!validLocales.includes(locale)) {
    return null;
  }

  return null;
}
