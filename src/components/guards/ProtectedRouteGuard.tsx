'use client';

import AppSplashScreen from '@/components/ui/AppSplashScreen';
import { canRoleAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { useAuthHydration, useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string[];
  requireAccessToken?: boolean;
}

/** Protects pages that require authentication and, optionally, a role. */
export default function ProtectedRouteGuard({
  children,
  redirectTo = '/auth/signin',
  requiredRole = [],
  requireAccessToken = false,
}: ProtectedRouteGuardProps) {
  const { user, accessToken, isAuthenticated, isLoading } = useAuthStore();
  const isHydrated = useAuthHydration();
  const router = useRouter();
  const t = useTranslations('auth.guard');
  const hasAuthenticatedSession =
    isAuthenticated && (!requireAccessToken || Boolean(accessToken));

  useEffect(() => {
    if (!isHydrated) return;
    if (!hasAuthenticatedSession) router.push(redirectTo);
  }, [isHydrated, hasAuthenticatedSession, router, redirectTo]);

  const hasRequiredRole = () => {
    if (requiredRole.length === 0) return true;
    const userRole = user?.role || '';
    if (requiredRole.includes(userRole)) return true;
    if (
      userRole === UserRole.REFEREE &&
      requiredRole.includes(UserRole.PLAYER)
    ) {
      return true;
    }
    return (
      requiredRole.includes(UserRole.HOST) &&
      canRoleAccessHostFeatures(userRole)
    );
  };

  if (!isHydrated || isLoading) {
    return <AppSplashScreen label={t('authenticating')} />;
  }

  if (!hasAuthenticatedSession) {
    return <AppSplashScreen label={t('redirectingToSignIn')} />;
  }

  if (!hasRequiredRole()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-red-500">
            {t('accessDenied')}
          </h1>
          <p className="text-muted-foreground">{t('permissionDenied')}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {t('requiredRole')} {requiredRole.join(', ')}
            </p>
            <p>
              {t('yourRole')} {user?.role || t('unknown')}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => router.push('/')}
          >
            {t('goHome')}
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
