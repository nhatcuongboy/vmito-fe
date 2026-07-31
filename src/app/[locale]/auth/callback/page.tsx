'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const role = searchParams.get('role');
    const image = searchParams.get('image');

    if (token && refreshToken && userId && email && role) {
      // Store auth data
      setAuth(
        {
          id: userId,
          email: email,
          name: name || '',
          role: role as UserRole,
          image: image,
        },
        token,
        refreshToken
      );

      // Defer toaster and redirect to next tick to avoid flushSync error
      setTimeout(() => {
        // Check for returnUrl first (passed from backend OAuth callback)
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
          router.replace(returnUrl);
          return;
        }

        // Otherwise redirect to Home
        const redirectPath = '/';

        router.replace(redirectPath);
      }, 0);
    } else {
      setError(t('invalidCallbackParameters'));
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.replace('/auth/signin');
      }, 3000);
    }
  }, [searchParams, setAuth, router, t]);

  if (error) {
    return (
      <MainLayout title={t('authenticationErrorTitle')}>
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="bg"
        >
          <VStack gap={4}>
            <Text color="red.500" fontSize="xl">
              {error}
            </Text>
            <Text color="fg.muted">{t('redirectingToSignIn')}</Text>
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
      bg="bg"
    >
      <VStack gap={4}>
        <Spinner size="xl" color="green.500" />
        <Text color="fg.muted">{t('completingSignIn')}</Text>
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
          bg="bg"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
