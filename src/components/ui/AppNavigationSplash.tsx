'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AppSplashScreen from './AppSplashScreen';

const NAVIGATION_FALLBACK_TIMEOUT_MS = 5000;

function isDesktopViewport() {
  return false;
}

function getInternalNavigationUrl(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }

  const target = event.target;
  if (!(target instanceof Element)) return null;

  const link = target.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.target && link.target !== '_self') return null;
  if (link.hasAttribute('download')) return null;

  const nextUrl = new URL(link.href, window.location.href);
  if (nextUrl.origin !== window.location.origin) return null;

  const currentUrl = new URL(window.location.href);
  const isSameDocument =
    nextUrl.pathname === currentUrl.pathname &&
    nextUrl.search === currentUrl.search;

  if (isSameDocument) return null;

  return nextUrl;
}

export default function AppNavigationSplash() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearNavigationSplash = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVisible(false);
    };

    clearNavigationSplash();

    return clearNavigationSplash;
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isDesktopViewport()) return;
      if (!getInternalNavigationUrl(event)) return;

      setIsVisible(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
        timeoutRef.current = null;
      }, NAVIGATION_FALLBACK_TIMEOUT_MS);
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return <AppSplashScreen label={t('navigating')} />;
}
