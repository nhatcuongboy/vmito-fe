'use client';

import { toaster } from '@/components/ui/toaster';
import { AuthService } from '@/lib/api/auth.service';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useCallback, useState } from 'react';
import { useRouter } from '@/i18n/config';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: {
            name?: { firstName?: string; lastName?: string };
            email?: string;
          };
        }>;
      };
    };
  }
}

function AppleIcon() {
  return (
    <svg
      aria-hidden
      className="size-[28px]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface AppleSignInButtonProps {
  className?: string;
}

// Apple rejects signIn() with this code when the user dismisses the popup — not a real error.
const POPUP_CLOSED_ERROR = 'popup_closed_by_user';

export default function AppleSignInButton({
  className,
}: AppleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

  const handleSignIn = useCallback(async () => {
    if (!clientId || !window.AppleID || isSubmitting) return;

    setIsSubmitting(true);
    try {
      window.AppleID.auth.init({
        clientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });

      const result = await window.AppleID.auth.signIn();
      const identityToken = result.authorization?.id_token;
      if (!identityToken) {
        throw new Error('Apple sign-in did not return an identity token');
      }

      await AuthService.appleSignIn({
        identityToken,
        givenName: result.user?.name?.firstName,
        familyName: result.user?.name?.lastName,
      });

      router.replace(searchParams.get('returnUrl') || '/');
    } catch (error: unknown) {
      const appleError = error as { error?: string };
      if (appleError?.error === POPUP_CLOSED_ERROR) return;

      console.error('Apple sign-in error:', error);
      const apiError = error as {
        response?: { data?: { message?: string } };
      };
      toaster.create({
        title: apiError.response?.data?.message || t('authenticationFailed'),
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [clientId, isSubmitting, router, searchParams, t]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(err) => {
          console.error('Failed to load Apple Sign In SDK script:', err);
        }}
      />
      <button
        type="button"
        onClick={handleSignIn}
        disabled={!scriptLoaded || isSubmitting}
        className={className}
        aria-label={t('continueWithApple')}
        title={t('continueWithApple')}
      >
        <AppleIcon />
      </button>
    </>
  );
}
