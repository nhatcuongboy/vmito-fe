'use client';

import MainLayout from '@/components/layout/MainLayout';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import {
  Box,
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
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/chakra-compat';

// SignIn form schema creator
function createSignInSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
    password: z.string().min(1, t('passwordRequired')),
  });
}

type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>;

interface SignInClientProps {
  locale: string;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle redirect for already authenticated users (e.g., direct URL access)
  useEffect(() => {
    if (!isHydrated) return;

    // If already authenticated before form submission, redirect
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);

      // Check for returnUrl in query params first
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        router.replace(returnUrl);
        return;
      }

      // Otherwise use role-based default - now all go to Home
      const targetPath = '/';
      router.replace(targetPath);
    }
  }, [isHydrated, isAuthenticated, user, router, isRedirecting, searchParams]);

  const signInSchema = useMemo(() => createSignInSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setFormError(null);
    try {
      const loginResponse = await AuthService.login({
        email: data.email,
        password: data.password,
      });

      // Check for returnUrl in query params first
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        setIsRedirecting(true);
        router.replace(returnUrl);
        return;
      }

      // Otherwise redirect to Home
      const redirectPath = '/';

      // Set redirecting state and navigate
      setIsRedirecting(true);
      router.replace(redirectPath);
    } catch (error: unknown) {
      // General login error handling
      console.error('Login error:', error);

      // Cast to a shape that might match Axios error or similar
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
            error?: { message?: string };
          };
          status?: number;
        };
      };

      // Extract error message
      const rawError =
        apiError.response?.data?.message ||
        apiError.response?.data?.error?.message;

      let errorMessage = t('invalidCredentials');

      if (
        rawError === 'Invalid credentials' ||
        apiError.response?.status === 401
      ) {
        errorMessage = t('invalidCredentials');
      } else if (
        rawError?.includes('Too Many Requests') ||
        apiError.response?.status === 429
      ) {
        errorMessage = t('tooManyRequests');
      } else if (rawError) {
        errorMessage = rawError;
      }

      setFormError(errorMessage);

      // If it's a 401 (Invalid credentials), highlight the fields
      if (apiError.response?.status === 401) {
        setError('email', { type: 'manual', message: '' });
        setError('password', { type: 'manual', message: '' });
      }
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
        bg={{ base: 'gray.50', _dark: 'gray.950' }}
      >
        <VStack gap={4}>
          <Spinner size="lg" color="green.500" />
          <Text color="fg.muted">
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
          bg={{ base: 'white', _dark: 'gray.800' }}
          p={8}
          borderRadius="lg"
          boxShadow="lg"
          border="1px solid"
          borderColor="border"
        >
          <VStack gap={6}>
            <Box textAlign="center">
              <Heading
                size="lg"
                color="green.600"
                _dark={{ color: 'blue.400' }}
              >
                {t('appTitle')}
              </Heading>
              <Text color="fg.muted" mt={2}>
                {t('description')}
              </Text>
            </Box>

            {(formError || searchParams.get('error')) && (
              <Box
                bg={{ base: 'red.50', _dark: 'red.900/30' }}
                color={{ base: 'red.700', _dark: 'red.300' }}
                p={3}
                width="100%"
                borderRadius="md"
                border="1px solid"
                borderColor={{ base: 'red.200', _dark: 'red.800' }}
              >
                {formError ||
                  (searchParams.get('error') === 'CredentialsSignin'
                    ? t('invalidEmailOrPassword')
                    : t('authenticationFailed'))}
              </Box>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
              <VStack gap={4}>
                <Field.Root invalid={!!errors.email}>
                  <Field.Label>
                    {t('email')}{' '}
                    <Box as="span" color="red.500">
                      *
                    </Box>
                  </Field.Label>
                  <Input
                    {...register('email')}
                    data-testid="email-input"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.email?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label>
                    {t('password')}{' '}
                    <Box as="span" color="red.500">
                      *
                    </Box>
                  </Field.Label>
                  <PasswordInput
                    {...register('password')}
                    data-testid="password-input"
                    placeholder={t('passwordPlaceholder')}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.password?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Button
                  type="submit"
                  data-testid="login-button"
                  colorPalette="green"
                  width="full"
                  size="lg"
                  loading={isSubmitting}
                >
                  {t('signInButton')}
                </Button>
              </VStack>
            </form>

            <Separator />

            {/* Google Login Button */}
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google?locale=${locale}${searchParams.get('returnUrl') ? `&returnUrl=${encodeURIComponent(searchParams.get('returnUrl')!)}` : ''}`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={2}
              width="full"
              py={3}
              px={4}
              borderRadius="md"
              border="1px solid"
              borderColor="border"
              fontWeight="semibold"
              color="fg"
              bg={{ base: 'white', _dark: 'gray.700' }}
              _hover={{
                bg: { base: 'gray.50', _dark: 'gray.600' },
                textDecoration: 'none',
              }}
            >
              <svg
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              {t('continueWithGoogle')}
            </Link>

            <VStack gap={2}>
              <Text color="fg.muted">
                {t('noAccount')}{' '}
                <Link
                  href={ROUTES.AUTH.SIGNUP}
                  color="green.600"
                  _dark={{ color: 'blue.400' }}
                  fontWeight="semibold"
                >
                  {t('signUp')}
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Box>
    </MainLayout>
  );
}

export default function SignInClient({ locale }: SignInClientProps) {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          bg={{ base: 'gray.50', _dark: 'gray.950' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
