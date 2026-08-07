'use client';

import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/primitives/button';
import { ROUTES } from '@/constants';
import { Link, useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthHeading,
  AuthInlineLoadingState,
  AuthLoadingState,
  AuthPageContent,
  AuthPasswordInput,
  AuthSubmitButton,
  authInputClassName,
  authLinkClassName,
} from '../components/AuthFormPrimitives';

type TTranslate = (
  key: string,
  values?: Record<string, string | number>
) => string;

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
  const t = useTranslations('auth.resetPassword');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const token = searchParams.get('token')?.trim() || '';
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      return;
    }

    let isMounted = true;
    const verifyToken = async () => {
      try {
        const result = await AuthService.verifyResetToken(token);
        if (!isMounted) return;
        if (result.valid) {
          setMaskedEmail(result.maskedEmail);
        } else {
          setTokenError(t('invalidOrExpiredToken'));
        }
      } catch {
        if (isMounted) setTokenError(t('invalidOrExpiredToken'));
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    void verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token, t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
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
      } else if (
        apiError.response?.status === 400 ||
        apiError.response?.status === 401
      ) {
        setFormError(t('invalidOrExpiredToken'));
      } else {
        setFormError(t('resetFailed'));
      }
    }
  };

  const description = maskedEmail
    ? t('descriptionWithEmail', { email: maskedEmail })
    : t('description');
  const goToSignIn = () => router.push(ROUTES.AUTH.SIGNIN);
  const backButton = (
    <Button className="w-full" onClick={goToSignIn}>
      {t('backToSignIn')}
    </Button>
  );

  let content;
  if (isVerifying) {
    content = <AuthInlineLoadingState />;
  } else if (!token) {
    content = (
      <div className="auth-form-stack">
        <AuthAlert variant="error">{t('missingToken')}</AuthAlert>
        {backButton}
      </div>
    );
  } else if (tokenError) {
    content = (
      <div className="space-y-4">
        <AuthAlert variant="error">{tokenError}</AuthAlert>
        {backButton}
      </div>
    );
  } else if (isSubmitted) {
    content = (
      <div className="space-y-4">
        <AuthAlert variant="success">
          {maskedEmail
            ? t('successMessageWithEmail', { email: maskedEmail })
            : t('successMessage')}
        </AuthAlert>
        {backButton}
      </div>
    );
  } else {
    content = (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form-stack"
        noValidate
      >
        {formError ? <AuthAlert variant="error">{formError}</AuthAlert> : null}
        <AuthField
          id="reset-password"
          label={t('newPassword')}
          error={errors.newPassword?.message}
          required
        >
          <AuthPasswordInput
            {...register('newPassword')}
            id="reset-password"
            placeholder={t('newPasswordPlaceholder')}
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby={
              errors.newPassword ? 'reset-password-error' : undefined
            }
            className={authInputClassName}
          />
        </AuthField>
        <AuthField
          id="reset-confirm-password"
          label={t('confirmPassword')}
          error={errors.confirmPassword?.message}
          required
        >
          <AuthPasswordInput
            {...register('confirmPassword')}
            id="reset-confirm-password"
            placeholder={t('confirmPasswordPlaceholder')}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword
                ? 'reset-confirm-password-error'
                : undefined
            }
            className={authInputClassName}
          />
        </AuthField>
        <AuthSubmitButton type="submit" loading={isSubmitting}>
          {t('submitButton')}
        </AuthSubmitButton>
      </form>
    );
  }

  return (
    <PublicRouteGuard redirectTo="/">
      <MainLayout title="Vmito">
        <AuthPageContent>
          <AuthCard>
            <AuthHeading title={t('heading')} description={description} />
            {content}
            {!isSubmitted && token && !tokenError ? (
              <p className="auth-card-footer">
                <Link href={ROUTES.AUTH.SIGNIN} className={authLinkClassName}>
                  {t('backToSignIn')}
                </Link>
              </p>
            ) : null}
          </AuthCard>
        </AuthPageContent>
      </MainLayout>
    </PublicRouteGuard>
  );
}

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
