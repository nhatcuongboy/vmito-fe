'use client';

import MainLayout from '@/components/layout/MainLayout';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Link,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toaster } from '@/components/ui/toaster';
import { z } from 'zod';

// Define zod schema for form validation
const signInSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const { user, isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get callbackUrl from query params, strip locale prefix if present
  const rawCallbackUrl = searchParams.get('callbackUrl') || '/host';
  // Remove leading locale prefix if exists (e.g., /en/host -> /host)
  const callbackUrl = rawCallbackUrl.replace(/^\/(vi|en)/, '') || '/host';

  // Handle redirect for already authenticated users (e.g., direct URL access)
  useEffect(() => {
    if (!isHydrated) return;

    // If already authenticated before form submission, redirect
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);
      const targetPath = user.role !== 'GUEST' ? '/dashboard' : '/join-by-code';
      router.replace(targetPath);
    }
  }, [isHydrated, isAuthenticated, user, router, isRedirecting]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const loginResponse = await AuthService.login({
        email: data.email,
        password: data.password,
      });

      toaster.success({ title: t('loginSuccessful') });

      // Redirect based on user role if no specific callbackUrl
      const hasCustomCallback = searchParams.get('callbackUrl');
      let redirectPath = callbackUrl;

      if (!hasCustomCallback && loginResponse.user) {
        // Default redirect based on role
        if (loginResponse.user.role === 'HOST' || loginResponse.user.role === 'PLAYER') {
          redirectPath = '/dashboard';
        } else {
          // GUEST role
          redirectPath = '/my-session';
        }
      }

      // Set redirecting state and navigate
      setIsRedirecting(true);
      router.replace(redirectPath);
    } catch (error: unknown) {
      // Error toast is handled by axios interceptor
      console.error('Login error:', error);
    }
  };

  // Show loading while checking auth or redirecting
  if (!isHydrated || isRedirecting) {
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
          <Text color="gray.600">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <MainLayout title={t('title')}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={8}
        height="100%"
      >
        <Box
          maxW="md"
          w="full"
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          <VStack gap={6}>
            <Box textAlign="center">
              <Heading size="lg" color="brand.600">
                {t('appTitle')}
              </Heading>
              <Text color="gray.600" mt={2}>
                {t('description')}
              </Text>
            </Box>

            {searchParams.get('error') && (
              <Box
                bg="red.50"
                color="red.700"
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor="red.200"
              >
                {searchParams.get('error') === 'CredentialsSignin'
                  ? t('invalidEmailOrPassword')
                  : t('authenticationFailed')}
              </Box>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <VStack gap={4}>
                <Field.Root invalid={!!errors.email}>
                  <Field.Label>{t('email')}</Field.Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                  />
                  <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label>{t('password')}</Field.Label>
                  <PasswordInput
                    {...register('password')}
                    placeholder={t('passwordPlaceholder')}
                  />
                  <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
                </Field.Root>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  loading={isSubmitting}
                >
                  {t('signInButton')}
                </Button>
              </VStack>
            </form>

            <Separator />

            <VStack gap={2}>
              <Text color="gray.600">
                {t('noAccount')}{' '}
                <Link
                  href="/auth/signup"
                  color="blue.600"
                  fontWeight="semibold"
                >
                  {t('signUp')}
                </Link>
              </Text>

              <Text color="gray.500" fontSize="sm">
                {t('or')}{' '}
                <Link
                  href="/join-by-code"
                  color="blue.600"
                  fontWeight="semibold"
                >
                  {t('joinAsGuest')}
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Box>
    </MainLayout>
  );
}

export default function SignInPage() {
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
      <SignInForm />
    </Suspense>
  );
}
