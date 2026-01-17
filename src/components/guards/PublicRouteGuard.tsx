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
  redirectTo = '/dashboard',
}: PublicRouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isHydrated = useAuthHydration();
  const router = useRouter();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    // If already logged in, redirect to functional pages
    if (isAuthenticated && user) {
      let targetPath = redirectTo;

      // Override redirectTo based on user role
      if (user.role === 'ADMIN' || user.role === 'HOST') {
        targetPath = '/host/dashboard';
      } else if (user.role === 'PLAYER') {
        targetPath = '/player/dashboard';
      } else {
        targetPath = '/join-by-code';
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
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Checking authentication...</Text>
        </VStack>
      </Box>
    );
  }

  // If already logged in, show loading while redirecting
  if (isAuthenticated) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Redirecting...</Text>
        </VStack>
      </Box>
    );
  }

  // If not logged in, allow access
  return <>{children}</>;
}
