'use client';

import MainLayout from '@/components/layout/MainLayout';
import { AuthLoadingState } from '@/app/[locale]/auth/components/AuthFormPrimitives';
import { api } from '@/lib/api/base';
import { UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { useEffect, useState } from 'react';

type WebViewLogin = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    image?: string | null;
  };
};

const safeReturnUrl = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

/// Consumes a native one-time bridge code. Credentials intentionally arrive in
/// the fragment: browsers do not send it to the server or include it in refs.
export default function MobileCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const code = fragment.get('code');
    const returnUrl = safeReturnUrl(fragment.get('returnUrl'));
    window.history.replaceState(null, '', window.location.pathname);
    if (!code) {
      setFailed(true);
      return;
    }
    void api
      .post<{ data: WebViewLogin }>(
        '/auth/webview-sessions/exchange',
        { code },
        { skipGlobalError: true }
      )
      .then((response) => {
        const login = response.data.data;
        setAuth(
          { ...login.user, name: login.user.name ?? null },
          login.accessToken,
          login.refreshToken
        );
        router.replace(returnUrl);
      })
      .catch(() => setFailed(true));
  }, [router, setAuth]);

  if (failed) {
    return (
      <MainLayout title="Unable to open this page">
        <main className="flex min-h-screen items-center justify-center px-4 text-center">
          <p role="alert">
            This secure link has expired. Return to the app and try again.
          </p>
        </main>
      </MainLayout>
    );
  }
  return <AuthLoadingState label="Opening secure page…" />;
}
