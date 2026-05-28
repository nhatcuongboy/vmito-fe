'use client';

import { Button } from '@/components/ui/chakra-compat';
import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { PasswordInput } from '@/components/ui/password-input';
import { ROUTES } from '@/constants';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import {
  Box,
  Field,
  Heading,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type TTranslate = (key: string) => string;

function createResetPasswordSchema(t: TTranslate) {
  return z
    .object({
      newPassword: z.string().min(6, t('passwordTooShort')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('auth.resetPassword');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const token = searchParams.get('token')?.trim() || '';

  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setFormError(null);

    try {
      await AuthService.resetPassword({
        token,
        newPassword: data.newPassword,
      });

      setIsSubmitted(true);
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: { message?: string; error?: { message?: string } };
          status?: number;
        };
      };
      const rawError =
        apiError.response?.data?.message ||
        apiError.response?.data?.error?.message;

      if (
        rawError?.includes('Too Many Requests') ||
        apiError.response?.status === 429
      ) {
        setFormError(t('tooManyRequests'));
        return;
      }

      if (
        apiError.response?.status === 400 ||
        apiError.response?.status === 401
      ) {
        setFormError(t('invalidOrExpiredToken'));
        return;
      }

      setFormError(t('resetFailed'));
    }
  };

  const goToSignIn = () => {
    router.push(ROUTES.AUTH.SIGNIN);
  };

  return (
    <PublicRouteGuard redirectTo="/">
      <MainLayout title="Vmito">
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
                <Heading size="lg" color="green.600">
                  {t('heading')}
                </Heading>
                <Text color="fg.muted" mt={2}>
                  {t('description')}
                </Text>
              </Box>

              {!token ? (
                <VStack gap={4} width="full">
                  <Box
                    bg={{ base: 'red.50', _dark: 'red.900/30' }}
                    color={{ base: 'red.700', _dark: 'red.300' }}
                    p={4}
                    width="100%"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={{ base: 'red.200', _dark: 'red.800' }}
                  >
                    {t('missingToken')}
                  </Box>
                  <Button
                    colorPalette="green"
                    width="full"
                    onClick={goToSignIn}
                  >
                    {t('backToSignIn')}
                  </Button>
                </VStack>
              ) : isSubmitted ? (
                <VStack gap={4} width="full">
                  <Box
                    bg={{ base: 'green.50', _dark: 'green.900/30' }}
                    color={{ base: 'green.700', _dark: 'green.300' }}
                    p={4}
                    width="100%"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={{ base: 'green.200', _dark: 'green.800' }}
                  >
                    {t('successMessage')}
                  </Box>
                  <Button
                    colorPalette="green"
                    width="full"
                    onClick={goToSignIn}
                  >
                    {t('backToSignIn')}
                  </Button>
                </VStack>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  style={{ width: '100%' }}
                >
                  <VStack gap={4}>
                    {formError && (
                      <Box
                        bg={{ base: 'red.50', _dark: 'red.900/30' }}
                        color={{ base: 'red.700', _dark: 'red.300' }}
                        p={3}
                        width="100%"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={{ base: 'red.200', _dark: 'red.800' }}
                      >
                        {formError}
                      </Box>
                    )}

                    <Field.Root invalid={!!errors.newPassword}>
                      <Field.Label>{t('newPassword')} *</Field.Label>
                      <PasswordInput
                        {...register('newPassword')}
                        placeholder={t('newPasswordPlaceholder')}
                        autoComplete="new-password"
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.newPassword?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.confirmPassword}>
                      <Field.Label>{t('confirmPassword')} *</Field.Label>
                      <PasswordInput
                        {...register('confirmPassword')}
                        placeholder={t('confirmPasswordPlaceholder')}
                        autoComplete="new-password"
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.confirmPassword?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Button
                      type="submit"
                      colorPalette="green"
                      width="full"
                      size="lg"
                      loading={isSubmitting}
                    >
                      {t('submitButton')}
                    </Button>
                  </VStack>
                </form>
              )}

              {!isSubmitted && token && (
                <Link
                  href={`/${locale}${ROUTES.AUTH.SIGNIN}`}
                  color="green.600"
                  fontWeight="semibold"
                >
                  {t('backToSignIn')}
                </Link>
              )}
            </VStack>
          </Box>
        </Box>
      </MainLayout>
    </PublicRouteGuard>
  );
}

export default function ResetPasswordClient() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
