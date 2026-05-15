'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/chakra-compat';
import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { ROUTES } from '@/constants';
import { AuthService } from '@/lib/api/auth.service';
import { Box, Field, Heading, Link, Text, VStack } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type TTranslate = (key: string) => string;

function createForgotPasswordSchema(t: TTranslate) {
  return z.object({
    email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
  });
}

type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

interface ForgotPasswordClientProps {
  locale: string;
}

export default function ForgotPasswordClient({
  locale,
}: ForgotPasswordClientProps) {
  const t = useTranslations('auth.forgotPassword');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError(null);

    try {
      const redirectUrl = `${window.location.origin}/${locale}${ROUTES.AUTH.RESET_PASSWORD}`;

      await AuthService.forgotPassword({
        email: data.email,
        locale,
        redirectUrl,
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

      setFormError(t('requestFailed'));
    }
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

              {isSubmitted ? (
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

                    <Field.Root invalid={!!errors.email}>
                      <Field.Label>{t('email')} *</Field.Label>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.email?.message}
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

              <Link
                href={`/${locale}${ROUTES.AUTH.SIGNIN}`}
                color="green.600"
                fontWeight="semibold"
              >
                {t('backToSignIn')}
              </Link>
            </VStack>
          </Box>
        </Box>
      </MainLayout>
    </PublicRouteGuard>
  );
}
