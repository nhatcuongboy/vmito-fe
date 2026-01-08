'use client';

import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { useEffect } from 'react';
import { Box, Spinner, Text, VStack, Button } from '@chakra-ui/react';

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string[];
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
}: ProtectedRouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isHydrated = useAuthHydration();
  const router = useRouter();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!isHydrated) return;

    // If not logged in, redirect to signin
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      // next-intl router automatically handles locale prefix
      const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(
        currentPath
      )}`;
      router.push(redirectUrl);
    }
  }, [isHydrated, isAuthenticated, router, redirectTo]);

  // Check role permission if required
  const hasRequiredRole = () => {
    if (requiredRole.length === 0) return true;
    return requiredRole.includes(user?.role || '');
  };

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
          <Text color="gray.600">Authenticating...</Text>
        </VStack>
      </Box>
    );
  }

  // If not logged in, show loading while redirecting
  if (!isAuthenticated) {
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
          <Text color="gray.600">Redirecting to sign in...</Text>
        </VStack>
      </Box>
    );
  }

  // Check role permission
  if (isAuthenticated && !hasRequiredRole()) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        px={4}
      >
        <VStack gap={6} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            Access Denied
          </Text>
          <Text color="gray.600">
            You don&apos;t have permission to access this page.
          </Text>
          <Text fontSize="sm" color="gray.500">
            Required role: {requiredRole.join(', ')}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Your role: {user?.role || 'Unknown'}
          </Text>
          <Button colorScheme="blue" onClick={() => router.push(`/`)}>
            Go Home
          </Button>
        </VStack>
      </Box>
    );
  }

  // If authenticated and has permission, allow access
  return <>{children}</>;
}
