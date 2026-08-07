'use client';

import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/primitives/input';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants';
import { Link, useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import type { RegisterRequest } from '@/types/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AuthCard,
  AuthField,
  AuthHeading,
  AuthPageContent,
  AuthPasswordInput,
  AuthSubmitButton,
  authInputClassName,
  authLinkClassName,
  authSelectClassName,
} from '../components/AuthFormPrimitives';

type TTranslate = (key: string) => string;
type TRegisterGender = NonNullable<RegisterRequest['gender']>;

const isRegisterGender = (value: string): value is TRegisterGender =>
  value === 'MALE' || value === 'FEMALE';

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
        .refine((value) => !value || ['MALE', 'FEMALE'].includes(value), {
          message: t('genderInvalid'),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

export default function SignUpClient({ locale }: { locale: string }) {
  const t = useTranslations('auth.signup');
  const tCommon = useTranslations('common');
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
      phone: '',
      gender: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const normalizedPhone = data.phone?.trim() || undefined;
      const normalizedGender =
        data.gender && isRegisterGender(data.gender) ? data.gender : undefined;

      await AuthService.register(
        {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: normalizedPhone,
          gender: normalizedGender,
        },
        locale
      );

      toaster.success({ title: t('accountCreated') });
      router.push(ROUTES.AUTH.SIGNIN);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const apiError = error as {
        response?: {
          data?: { message?: string; error?: { message?: string } };
          status?: number;
        };
      };
      const rawError =
        apiError.response?.data?.message ||
        apiError.response?.data?.error?.message;
      let errorMessage = t('registrationFailed');

      if (
        rawError?.includes('Too Many Requests') ||
        apiError.response?.status === 429
      ) {
        errorMessage = t('tooManyRequests');
      } else if (
        rawError === 'User already exists' ||
        apiError.response?.status === 409
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
        <AuthPageContent>
          <AuthCard>
            <AuthHeading title={t('heading')} />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="auth-form-stack"
              noValidate
            >
              <AuthField
                id="signup-name"
                label={t('name')}
                error={errors.name?.message}
                required
              >
                <Input
                  {...register('name')}
                  id="signup-name"
                  placeholder={t('namePlaceholder')}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={
                    errors.name ? 'signup-name-error' : undefined
                  }
                  className={authInputClassName}
                />
              </AuthField>

              <AuthField
                id="signup-email"
                label={t('email')}
                error={errors.email?.message}
                required
              >
                <Input
                  {...register('email')}
                  id="signup-email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? 'signup-email-error' : undefined
                  }
                  className={authInputClassName}
                />
              </AuthField>

              <div className="auth-form-grid">
                <AuthField
                  id="signup-phone"
                  label={tCommon('phone')}
                  error={errors.phone?.message}
                >
                  <Input
                    {...register('phone')}
                    id="signup-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder={t('phonePlaceholder')}
                    autoComplete="tel"
                    maxLength={10}
                    aria-invalid={!!errors.phone}
                    aria-describedby={
                      errors.phone ? 'signup-phone-error' : undefined
                    }
                    className={authInputClassName}
                  />
                </AuthField>
                <AuthField
                  id="signup-gender"
                  label={tCommon('gender')}
                  error={errors.gender?.message}
                >
                  <select
                    {...register('gender')}
                    id="signup-gender"
                    aria-invalid={!!errors.gender}
                    aria-describedby={
                      errors.gender ? 'signup-gender-error' : undefined
                    }
                    className={authSelectClassName}
                  >
                    <option value="">{tCommon('selectGender')}</option>
                    <option value="MALE">{tCommon('male')}</option>
                    <option value="FEMALE">{tCommon('female')}</option>
                  </select>
                </AuthField>
              </div>

              <AuthField
                id="signup-password"
                label={t('password')}
                error={errors.password?.message}
                required
              >
                <AuthPasswordInput
                  {...register('password')}
                  id="signup-password"
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? 'signup-password-error' : undefined
                  }
                  className={authInputClassName}
                />
              </AuthField>

              <AuthField
                id="signup-confirm-password"
                label={t('confirmPassword')}
                error={errors.confirmPassword?.message}
                required
              >
                <AuthPasswordInput
                  {...register('confirmPassword')}
                  id="signup-confirm-password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'signup-confirm-password-error'
                      : undefined
                  }
                  className={authInputClassName}
                />
              </AuthField>

              <AuthSubmitButton type="submit" loading={isSubmitting}>
                {t('createAccount')}
              </AuthSubmitButton>
            </form>

            <p className="auth-card-footer">
              {t('alreadyHaveAccount')}{' '}
              <Link href={ROUTES.AUTH.SIGNIN} className={authLinkClassName}>
                {t('signIn')}
              </Link>
            </p>
          </AuthCard>
        </AuthPageContent>
      </MainLayout>
    </PublicRouteGuard>
  );
}
