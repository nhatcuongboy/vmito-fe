'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthLoadingState } from '../components/AuthFormPrimitives';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const role = searchParams.get('role');
    const image = searchParams.get('image');

    if (token && refreshToken && userId && email && role) {
      setAuth(
        {
          id: userId,
          email,
          name: name || '',
          role: role as UserRole,
          image,
        },
        token,
        refreshToken
      );

      setTimeout(() => {
        router.replace(searchParams.get('returnUrl') || '/');
      }, 0);
    } else {
      setError(t('invalidCallbackParameters'));
      const redirectTimer = window.setTimeout(() => {
        router.replace('/auth/signin');
      }, 3000);
      return () => window.clearTimeout(redirectTimer);
    }
  }, [searchParams, setAuth, router, t]);

  if (error) {
    return (
      <MainLayout title={t('authenticationErrorTitle')}>
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
          <div className="space-y-4">
            <p role="alert" className="text-xl text-red-500">
              {error}
            </p>
            <p className="text-muted-foreground">{t('redirectingToSignIn')}</p>
          </div>
        </main>
      </MainLayout>
    );
  }

  return <AuthLoadingState label={t('completingSignIn')} />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
