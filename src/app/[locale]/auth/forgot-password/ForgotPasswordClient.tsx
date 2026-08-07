'use client';

import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/primitives/input';
import { ROUTES } from '@/constants';
import { Link } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthHeading,
  AuthPageContent,
  AuthSubmitButton,
  authInputClassName,
  authLinkClassName,
} from '../components/AuthFormPrimitives';

type TTranslate = (key: string) => string;

function createForgotPasswordSchema(t: TTranslate) {
  return z.object({
    email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
  });
}

type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export default function ForgotPasswordClient({ locale }: { locale: string }) {
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
    defaultValues: { email: '' },
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

      setFormError(
        rawError?.includes('Too Many Requests') ||
          apiError.response?.status === 429
          ? t('tooManyRequests')
          : t('requestFailed')
      );
    }
  };

  return (
    <PublicRouteGuard redirectTo="/">
      <MainLayout title="Vmito">
        <AuthPageContent>
          <AuthCard>
            <AuthHeading title={t('heading')} description={t('description')} />

            {isSubmitted ? (
              <AuthAlert variant="success">{t('successMessage')}</AuthAlert>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="auth-form-stack"
                noValidate
              >
                {formError ? (
                  <AuthAlert variant="error">{formError}</AuthAlert>
                ) : null}
                <AuthField
                  id="forgot-email"
                  label={t('email')}
                  error={errors.email?.message}
                  required
                >
                  <Input
                    {...register('email')}
                    id="forgot-email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? 'forgot-email-error' : undefined
                    }
                    className={authInputClassName}
                  />
                </AuthField>
                <AuthSubmitButton type="submit" loading={isSubmitting}>
                  {t('submitButton')}
                </AuthSubmitButton>
              </form>
            )}

            <p className="auth-card-footer">
              <Link href={ROUTES.AUTH.SIGNIN} className={authLinkClassName}>
                {t('backToSignIn')}
              </Link>
            </p>
          </AuthCard>
        </AuthPageContent>
      </MainLayout>
    </PublicRouteGuard>
  );
}
