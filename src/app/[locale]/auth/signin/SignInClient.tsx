'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/primitives/input';
import { Separator } from '@/components/primitives/separator';
import { ROUTES } from '@/constants';
import { Link, useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import { useAuthHydration, useAuthStore } from '@/stores/useAuthStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  AuthAlert,
  AuthCard,
  AuthField,
  AuthHeading,
  AuthLoadingState,
  AuthPageContent,
  AuthPasswordInput,
  AuthSubmitButton,
  authInputClassName,
  authLinkClassName,
} from '../components/AuthFormPrimitives';

function createSignInSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('invalidEmail')).min(1, t('emailRequired')),
    password: z.string().min(1, t('passwordRequired')),
  });
}

type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>;

function GoogleIcon() {
  return (
    <svg aria-hidden className="size-[18px]" viewBox="0 0 48 48">
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
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden className="size-[18px]" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const tGuard = useTranslations('auth.guard');
  const locale = useLocale();
  const { user, isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);
      router.replace(searchParams.get('returnUrl') || '/');
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
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    setFormError(null);
    try {
      await AuthService.login(data);
      setIsRedirecting(true);
      router.replace(searchParams.get('returnUrl') || '/');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const apiError = error as {
        response?: {
          data?: { message?: string; error?: { message?: string } };
          status?: number;
        };
      };
      const rawError =
        apiError.response?.data?.message ||
        apiError.response?.data?.error?.message;
      let errorMessage = t('invalidCredentials');

      if (
        rawError?.includes('Too Many Requests') ||
        apiError.response?.status === 429
      ) {
        errorMessage = t('tooManyRequests');
      } else if (
        rawError !== 'Invalid credentials' &&
        apiError.response?.status !== 401 &&
        rawError
      ) {
        errorMessage = rawError;
      }

      setFormError(errorMessage);
      if (apiError.response?.status === 401) {
        setError('email', { type: 'manual', message: '' });
        setError('password', { type: 'manual', message: '' });
      }
    }
  };

  if (!isHydrated || isRedirecting) {
    return (
      <AuthLoadingState
        label={isRedirecting ? tGuard('redirecting') : tGuard('loading')}
      />
    );
  }

  const returnUrl = searchParams.get('returnUrl');
  const socialQuery = `locale=${locale}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  const socialLinkClass = 'auth-social-link';
  const queryError = searchParams.get('error');

  return (
    <MainLayout title="Vmito">
      <AuthPageContent>
        <AuthCard>
          <AuthHeading title={t('appTitle')} description={t('description')} />

          {formError || queryError ? (
            <AuthAlert variant="error">
              {formError ||
                (queryError === 'CredentialsSignin'
                  ? t('invalidEmailOrPassword')
                  : t('authenticationFailed'))}
            </AuthAlert>
          ) : null}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="auth-form-stack"
            noValidate
          >
            <AuthField
              id="signin-email"
              label={t('email')}
              error={errors.email?.message}
              required
            >
              <Input
                {...register('email')}
                id="signin-email"
                data-testid="email-input"
                type="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? 'signin-email-error' : undefined
                }
                className={authInputClassName}
              />
            </AuthField>

            <div className="auth-field">
              <div className="auth-field-label-row">
                <label htmlFor="signin-password" className="auth-field-label">
                  {t('password')} <span className="text-red-500">*</span>
                </label>
                <Link
                  href={ROUTES.AUTH.FORGOT_PASSWORD}
                  className={`${authLinkClassName} auth-link-small`}
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <AuthPasswordInput
                {...register('password')}
                id="signin-password"
                data-testid="password-input"
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'signin-password-error' : undefined
                }
                className={authInputClassName}
              />
              {errors.password?.message ? (
                <p
                  id="signin-password-error"
                  role="alert"
                  className="auth-field-error"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <AuthSubmitButton
              type="submit"
              data-testid="login-button"
              loading={isSubmitting}
            >
              {t('signInButton')}
            </AuthSubmitButton>
          </form>

          <Separator />
          <div className="auth-social-stack">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google?${socialQuery}`}
              className={socialLinkClass}
            >
              <GoogleIcon /> {t('continueWithGoogle')}
            </a>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook?${socialQuery}`}
              className={socialLinkClass}
            >
              <FacebookIcon /> {t('continueWithFacebook')}
            </a>
          </div>

          <p className="auth-card-footer">
            {t('noAccount')}{' '}
            <Link href={ROUTES.AUTH.SIGNUP} className={authLinkClassName}>
              {t('signUp')}
            </Link>
          </p>
        </AuthCard>
      </AuthPageContent>
    </MainLayout>
  );
}

export default function SignInClient() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <SignInForm />
    </Suspense>
  );
}
