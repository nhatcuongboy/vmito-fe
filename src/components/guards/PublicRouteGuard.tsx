'use client';

import AppSplashScreen from '@/components/ui/AppSplashScreen';
import { useRouter } from '@/i18n/config';
import { useAuthHydration, useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

interface PublicRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/** Redirects authenticated users away from public-only pages. */
export default function PublicRouteGuard({
  children,
  redirectTo = '/',
}: PublicRouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isHydrated = useAuthHydration();
  const router = useRouter();
  const t = useTranslations('auth.guard');

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user) {
      let targetPath = '/';

      if (user.role === 'GUEST') {
        const isPublicPage =
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/auth/signin') ||
            window.location.pathname.includes('/auth/signup'));

        if (isPublicPage) {
          targetPath = '/join-by-code';
        } else {
          return;
        }
      }

      if (
        typeof window !== 'undefined' &&
        window.location.pathname.includes(targetPath)
      ) {
        return;
      }

      router.push(targetPath);
    }
  }, [user, isAuthenticated, isHydrated, router, redirectTo]);

  if (!isHydrated || isLoading) {
    return <AppSplashScreen label={t('checkingAuthentication')} />;
  }

  if (isAuthenticated && user) {
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : '';
    const guestCanStay =
      user.role === 'GUEST' && currentPath.includes('/join-by-code');

    if (guestCanStay) return <>{children}</>;
    return <AppSplashScreen label={t('redirecting')} />;
  }

  return <>{children}</>;
}
