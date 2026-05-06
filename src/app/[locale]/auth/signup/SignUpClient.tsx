'use client';
import { Input } from '@/components/ui/Input';

import { useRouter } from '@/i18n/config';
import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import { AuthService } from '@/lib/api/auth.service';
import { Box, VStack, Heading, Text, Link, Field } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { VSelect } from '@/components/ui/VSelect';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordInput } from '@/components/ui/password-input';
import { useMemo } from 'react';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/chakra-compat';
import type { RegisterRequest } from '@/types/auth';
import MainLayout from '@/components/layout/MainLayout';

// SignUp form schema creator
type TTranslate = (key: string) => string;
type TRegisterGender = NonNullable<RegisterRequest['gender']>;

const isRegisterGender = (value: string): value is TRegisterGender => {
  return value === 'MALE' || value === 'FEMALE' || value === 'OTHER';
};

function createSignUpSchema(t: TTranslate) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
      password: z.string().min(6, t('passwordTooShort')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
      phone: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || /^\d{10}$/.test(value), {
          message: t('phoneInvalid'),
        }),
      gender: z
        .string()
        .optional()
        .refine(
          (value) => !value || ['MALE', 'FEMALE', 'OTHER'].includes(value),
          {
            message: t('genderInvalid'),
          }
        ),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

interface SignUpClientProps {
  locale: string;
}

export default function SignUpClient({ locale }: SignUpClientProps) {
  const t = useTranslations('auth.signup');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const signUpSchema = useMemo(() => createSignUpSchema(t), [t]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      gender: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      // Register user via backend API
      const normalizedPhone = data.phone?.trim() || undefined;
      const normalizedGender =
        data.gender && isRegisterGender(data.gender) ? data.gender : undefined;

      const registrationData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: normalizedPhone,
        gender: normalizedGender,
      };
      await AuthService.register(registrationData, locale);

      toaster.success({ title: t('accountCreated') });
      router.push(ROUTES.AUTH.SIGNIN);
    } catch (error: unknown) {
      // General registration error handling
      console.error('Registration error:', error);

      const errorWithResponse = error as {
        response?: {
          data?: { message?: string; error?: { message?: string } };
          status?: number;
        };
      };
      const rawError =
        errorWithResponse.response?.data?.message ||
        errorWithResponse.response?.data?.error?.message;

      let errorMessage = t('registrationFailed');

      if (
        rawError?.includes('Too Many Requests') ||
        errorWithResponse.response?.status === 429
      ) {
        errorMessage = t('tooManyRequests');
      } else if (
        rawError === 'User already exists' ||
        errorWithResponse.response?.status === 409
      ) {
        errorMessage = t('userAlreadyExists');
      } else if (rawError) {
        errorMessage = rawError;
      }

      toaster.error({ title: errorMessage });
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
              </Box>

              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={4}>
                  <Field.Root invalid={!!errors.name}>
                    <Field.Label>{t('name')} *</Field.Label>
                    <Input
                      {...register('name')}
                      placeholder={t('namePlaceholder')}
                      autoComplete="name"
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.name?.message}
                    </Field.ErrorText>
                  </Field.Root>

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

                  {/* Phone & Gender on the same row */}
                  <Box display="flex" gap={3} w="full" flexWrap="wrap">
                    <Field.Root invalid={!!errors.phone} flex="1" minW="140px">
                      <Field.Label>{tCommon('phone')}</Field.Label>
                      <Input
                        {...register('phone')}
                        type="tel"
                        inputMode="numeric"
                        placeholder={t('phonePlaceholder')}
                        autoComplete="tel"
                        maxLength={10}
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.phone?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.gender} flex="1" minW="140px">
                      <Field.Label>{tCommon('gender')}</Field.Label>
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <VSelect
                            name={field.name}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">{tCommon('selectGender')}</option>
                            <option value="MALE">{tCommon('male')}</option>
                            <option value="FEMALE">{tCommon('female')}</option>
                            <option value="OTHER">{tCommon('other')}</option>
                          </VSelect>
                        )}
                      />
                      <Field.ErrorText color="fg.error">
                        {errors.gender?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Box>

                  <Field.Root invalid={!!errors.password}>
                    <Field.Label>{t('password')} *</Field.Label>
                    <PasswordInput
                      {...register('password')}
                      placeholder={t('passwordPlaceholder')}
                      autoComplete="new-password"
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.password?.message}
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
                    {t('createAccount')}
                  </Button>
                </VStack>
              </form>

              <VStack gap={2}>
                <Text color="fg.muted">
                  {t('alreadyHaveAccount')}{' '}
                  <Link
                    href={ROUTES.AUTH.SIGNIN}
                    color="green.600"
                    fontWeight="semibold"
                  >
                    {t('signIn')}
                  </Link>
                </Text>
              </VStack>
            </VStack>
          </Box>
        </Box>
      </MainLayout>
    </PublicRouteGuard>
  );
}
