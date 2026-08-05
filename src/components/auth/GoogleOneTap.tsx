'use client';

import { useEffect, useCallback, useState } from 'react';
import Script from 'next/script';
import { useAuthStore, useAuthHydration } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            prompt_parent_id?: string;
            itp_support?: boolean;
            context?: 'signin' | 'signup' | 'use';
          }) => void;
          prompt: (
            notification?: (notification: {
              isNotDisplayed: () => boolean;
              getNotDisplayedReason: () => string;
              isSkippedMoment: () => boolean;
              getSkippedReason: () => string;
              isDismissedMoment: () => boolean;
              getDismissedReason: () => string;
            }) => void
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const { isAuthenticated } = useAuthStore();
  const isHydrated = useAuthHydration();
  const t = useTranslations('auth.signin');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) return;

      try {
        await AuthService.googleOneTap(response.credential);
      } catch (error: unknown) {
        console.error('Google One Tap authentication error:', error);
        const apiError = error as {
          response?: { data?: { message?: string } };
        };
        const message =
          apiError.response?.data?.message || t('authenticationFailed');
        toaster.create({
          title: message,
          type: 'error',
          duration: 4000,
        });
      }
    },
    [t]
  );

  const initializeGoogleOneTap = useCallback(() => {
    if (
      !clientId ||
      !window.google?.accounts?.id ||
      isAuthenticated ||
      !isHydrated
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.debug(
            'Google One Tap not displayed reason:',
            notification.getNotDisplayedReason()
          );
        } else if (notification.isSkippedMoment()) {
          console.debug(
            'Google One Tap skipped reason:',
            notification.getSkippedReason()
          );
        } else if (notification.isDismissedMoment()) {
          console.debug(
            'Google One Tap dismissed reason:',
            notification.getDismissedReason()
          );
        }
      });
    } catch (err) {
      console.error('Error initializing Google One Tap:', err);
    }
  }, [clientId, isAuthenticated, isHydrated, handleCredentialResponse]);

  useEffect(() => {
    if (scriptLoaded) {
      initializeGoogleOneTap();
    }
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [scriptLoaded, initializeGoogleOneTap]);

  // Don't load script or render if user is already authenticated or Client ID is missing
  if (isAuthenticated || !clientId) {
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      onError={(err) => {
        console.error('Failed to load Google GIS SDK script:', err);
      }}
    />
  );
}
