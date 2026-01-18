'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toaster } from '@/components/ui/toaster';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    if (token && userId && email && role) {
      // Store auth data
      setAuth(
        {
          id: userId,
          email: email,
          name: name || '',
          role: role as UserRole,
        },
        token
      );

      // Defer toaster and redirect to next tick to avoid flushSync error
      setTimeout(() => {
        // Redirect based on role
        let redirectPath = '/join-by-code';

        if (role === UserRole.HOST || role === UserRole.ADMIN) {
          redirectPath = '/host/dashboard';
        } else if (role === UserRole.PLAYER) {
          redirectPath = '/player/dashboard';
        }

        router.replace(redirectPath);
      }, 0);
    } else {
      setError('Invalid callback parameters');
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.replace('/auth/signin');
      }, 3000);
    }
  }, [searchParams, setAuth, router, t]);

  if (error) {
    return (
      <MainLayout title="Authentication Error">
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <VStack gap={4}>
            <Text color="red.500" fontSize="xl">
              {error}
            </Text>
            <Text color="gray.600">Redirecting to sign in...</Text>
          </VStack>
        </Box>
      </MainLayout>
    );
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <VStack gap={4}>
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Completing sign in...</Text>
      </VStack>
    </Box>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="blue.500" />
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
