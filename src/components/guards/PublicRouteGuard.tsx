'use client';

import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { useEffect } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

interface PublicRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * PublicRouteGuard - Protects public pages (no authentication required)
 * If user is already logged in, redirect to functional pages
 * Used for pages: /, /auth/signin, /auth/signup, /join-by-code
 */
export default function PublicRouteGuard({
  children,
  redirectTo = '/',
}: PublicRouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isHydrated = useAuthHydration();
  const router = useRouter();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    // If already logged in, redirect to functional pages
    if (isAuthenticated && user) {
      let targetPath = '/';

      // Special case for GUEST role - they are allowed on some public pages
      if (user.role === 'GUEST') {
        const isPublicPage =
          typeof window !== 'undefined' &&
          (window.location.pathname.includes('/auth/signin') ||
            window.location.pathname.includes('/auth/signup'));

        if (isPublicPage) {
          targetPath = '/join-by-code';
        } else {
          return; // Stay on current page
        }
      }

      // Avoid infinite redirect if already at target
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.includes(targetPath)
      ) {
        return;
      }

      // next-intl router automatically handles locale prefix
      router.push(targetPath);
    }
  }, [user, isAuthenticated, isHydrated, router, redirectTo]);

  // Loading state - waiting for hydration
  if (!isHydrated || isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="bg"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="green.500" />
          <Text color="fg.muted">Checking authentication...</Text>
        </VStack>
      </Box>
    );
  }

  // If already logged in, determine if we show children or loading
  if (isAuthenticated && user) {
    const isHostOrAdmin = user.role === 'ADMIN' || user.role === 'HOST';
    const isPlayer = user.role === 'PLAYER';
    const isGuest = user.role === 'GUEST';

    // Current path check
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname : '';
    const isOnJoinPage = currentPath.includes('/join-by-code');

    // If it's a role that MUST redirect, show redirecting state
    if (isHostOrAdmin || isPlayer) {
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="bg"
        >
          <VStack gap={4}>
            <Spinner size="lg" color="green.500" />
            <Text color="fg.muted">Redirecting...</Text>
          </VStack>
        </Box>
      );
    }

    // If it's a GUEST and they are ALREADY on join page, allow access
    if (isGuest && isOnJoinPage) {
      return <>{children}</>;
    }

    // Default for authenticated on other pages
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="bg"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="green.500" />
          <Text color="fg.muted">Redirecting...</Text>
        </VStack>
      </Box>
    );
  }

  // If not logged in, allow access
  return <>{children}</>;
}
