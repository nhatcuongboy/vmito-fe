'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import { AuthService } from '@/lib/api/auth.service';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  Link,
  Field,
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import TopBar from '@/components/ui/TopBar';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordInput } from '@/components/ui/password-input';
import { useMemo } from 'react';
import { ROUTES } from '@/constants';

// SignUp form schema creator
function createSignUpSchema(t: any) {
  return z
    .object({
      name: z.string().min(1, t('nameRequired')),
      email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
      password: z.string().min(6, t('passwordTooShort')),
      confirmPassword: z.string().min(1, t('confirmPasswordRequired')),
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
  const params = useParams();
  const localeFromParams = params.locale as string;
  const router = useRouter();

  const signUpSchema = useMemo(() => createSignUpSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      // Register user via backend API
      await AuthService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toaster.success({ title: t('accountCreated') });
      router.push(ROUTES.AUTH.SIGNIN);
    } catch (error: any) {
      // General registration error handling
      console.error('Registration error:', error);

      const rawError =
        error.response?.data?.message || error.response?.data?.error?.message;

      let errorMessage = t('registrationFailed');

      if (
        rawError?.includes('Too Many Requests') ||
        error.response?.status === 429
      ) {
        errorMessage = t('tooManyRequests');
      } else if (
        rawError === 'User already exists' ||
        error.response?.status === 409
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
      <Box minH="100vh" bg="gray.50">
        <TopBar title={t('title')} />
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
          py={8}
          pt="80px"
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
                <Heading size="lg" color="blue.600">
                  {t('heading')}
                </Heading>
                <Text color="gray.600" mt={2}>
                  {t('description')}
                </Text>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={4}>
                  <Field.Root invalid={!!errors.name}>
                    <Field.Label>{t('name')}</Field.Label>
                    <Input
                      {...register('name')}
                      placeholder={t('namePlaceholder')}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.name?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.email}>
                    <Field.Label>{t('email')}</Field.Label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder={t('emailPlaceholder')}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.email?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.password}>
                    <Field.Label>{t('password')}</Field.Label>
                    <PasswordInput
                      {...register('password')}
                      placeholder={t('passwordPlaceholder')}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.password?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.confirmPassword}>
                    <Field.Label>{t('confirmPassword')}</Field.Label>
                    <PasswordInput
                      {...register('confirmPassword')}
                      placeholder={t('confirmPasswordPlaceholder')}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.confirmPassword?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Button
                    type="submit"
                    colorPalette="blue"
                    width="full"
                    size="lg"
                    loading={isSubmitting}
                  >
                    {t('createAccount')}
                  </Button>
                </VStack>
              </form>

              <VStack gap={2}>
                <Text color="gray.600">
                  {t('alreadyHaveAccount')}{' '}
                  <Link
                    href={ROUTES.AUTH.SIGNIN}
                    color="blue.600"
                    fontWeight="semibold"
                  >
                    {t('signIn')}
                  </Link>
                </Text>

                <Text color="gray.500" fontSize="sm">
                  {t('or')}{' '}
                  <Link
                    href={ROUTES.JOIN.BY_CODE}
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
      </Box>
    </PublicRouteGuard>
  );
}
