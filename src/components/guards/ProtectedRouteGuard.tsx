'use client';

import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { useEffect } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { canRoleAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { UserRole } from '@/lib/api/types';
import AppSplashScreen from '@/components/ui/AppSplashScreen';

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string[];
  requireAccessToken?: boolean;
}

/**
 * ProtectedRouteGuard - Protects pages that require authentication
 * If user is not logged in, redirect to signin page
 * Used for pages: /host, /dashboard, /sessions, etc.
 */
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
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    // If not logged in, redirect to signin
    if (!hasAuthenticatedSession) {
      // next-intl router automatically handles locale prefix
      router.push(redirectTo);
    }
  }, [isHydrated, hasAuthenticatedSession, router, redirectTo]);

  // Check role permission if required
  // REFEREE keeps normal PLAYER access, plus referee-specific routes elsewhere.
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
    // If requiredRole includes HOST, allow VIP PLAYER access
    if (
      requiredRole.includes(UserRole.HOST) &&
      canRoleAccessHostFeatures(userRole)
    ) {
      return true;
    }
    return false;
  };

  // Loading state - waiting for hydration
  if (!isHydrated || isLoading) {
    return <AppSplashScreen label={t('authenticating')} />;
  }

  // If not logged in, show loading while redirecting
  if (!hasAuthenticatedSession) {
    return <AppSplashScreen label={t('redirectingToSignIn')} />;
  }

  // Check role permission
  if (isAuthenticated && !hasRequiredRole()) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="bg"
        px={4}
      >
        <VStack gap={6} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            {t('accessDenied')}
          </Text>
          <Text color="fg.muted">{t('permissionDenied')}</Text>
          <Text fontSize="sm" color="fg.muted">
            {t('requiredRole')} {requiredRole.join(', ')}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {t('yourRole')} {user?.role || t('unknown')}
          </Text>
          <Button colorPalette="green" onClick={() => router.push(`/`)}>
            {t('goHome')}
          </Button>
        </VStack>
      </Box>
    );
  }

  // If authenticated and has permission, allow access
  return <>{children}</>;
}
