'use client';

import { useEffect, useState } from 'react';
import {
  resolveInstallTarget,
  type InstallTarget,
} from '@/constants/android-app';
import {
  detectPWAPlatform,
  isAppInstallPromptDue,
  isIOSSafari,
  isPWAStandalone,
  type PWAPlatform,
} from '@/lib/pwa/install';
import { useAppInstallStore } from '@/stores/useAndroidInstallStore';

const EMBEDDED_STORAGE_KEY = 'vmito.embedded';

/** Mirrors MainLayout's own embedded-webview detection — showing an
 * "install the app" prompt inside the native app's own webview is broken. */
function isEmbeddedWebview(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('embedded') === '1' ||
    window.sessionStorage.getItem(EMBEDDED_STORAGE_KEY) === '1'
  );
}

interface GetInstalledRelatedAppsNavigator extends Navigator {
  getInstalledRelatedApps?: () => Promise<unknown[]>;
}

export interface AppInstallEligibility {
  platform: PWAPlatform;
  target: InstallTarget | null;
  /** Full-bottom-sheet popup — the primary, first-shown surface. */
  shouldShowPopup: boolean;
  /** Slim top banner — only once the popup has been dismissed or is
   * cooling down, never shown at the same time as the popup. */
  shouldShowBanner: boolean;
  dismiss: (targetKey: string) => void;
  /** Dismiss just the banner, independent of `dismiss` — see
   * `bannerDismissed` on the store for why this is a separate action. */
  dismissBanner: () => void;
}

export function useAppInstallEligibility(): AppInstallEligibility {
  const [platform, setPlatform] = useState<PWAPlatform>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [isIOSSafariBrowser, setIsIOSSafariBrowser] = useState(false);

  const target = resolveInstallTarget(platform);

  const hasHydrated = useAppInstallStore((state) => state._hasHydrated);
  const dismissedTargetKey = useAppInstallStore(
    (state) => state.dismissedTargetKey
  );
  const dismissedAt = useAppInstallStore((state) => state.dismissedAt);
  const androidRelatedAppInstalled = useAppInstallStore(
    (state) => state.androidRelatedAppInstalled
  );
  const setAndroidRelatedAppInstalled = useAppInstallStore(
    (state) => state.setAndroidRelatedAppInstalled
  );
  const dismiss = useAppInstallStore((state) => state.dismiss);
  const dismissBanner = useAppInstallStore((state) => state.dismissBanner);
  const bannerDismissed = useAppInstallStore((state) => state.bannerDismissed);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setPlatform(detectPWAPlatform(userAgent, navigator.maxTouchPoints));
    setIsStandalone(
      isPWAStandalone(
        window.matchMedia('(display-mode: standalone)').matches,
        window.navigator as { standalone?: boolean }
      )
    );
    setIsEmbedded(isEmbeddedWebview());
    setIsIOSSafariBrowser(isIOSSafari(userAgent));
  }, []);

  useEffect(() => {
    if (platform !== 'android' || androidRelatedAppInstalled !== null) return;
    const nav = navigator as GetInstalledRelatedAppsNavigator;
    if (!nav.getInstalledRelatedApps) return;

    let cancelled = false;
    nav
      .getInstalledRelatedApps()
      .then((apps) => {
        if (!cancelled) setAndroidRelatedAppInstalled(apps.length > 0);
      })
      .catch(() => {
        if (!cancelled) setAndroidRelatedAppInstalled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platform, androidRelatedAppInstalled, setAndroidRelatedAppInstalled]);

  const androidAlreadyInstalled =
    platform === 'android' && androidRelatedAppInstalled === true;

  const isDue = isAppInstallPromptDue({
    hasHydrated,
    isStandalone,
    targetKey: target?.targetKey ?? null,
    dismissedTargetKey,
    dismissedAt,
  });

  const commonlyBlocked = isEmbedded || !target || androidAlreadyInstalled;

  const shouldShowPopup = !commonlyBlocked && isDue;

  const hasDismissedRecently =
    hasHydrated &&
    !!target &&
    dismissedTargetKey === target.targetKey &&
    dismissedAt !== null;

  const shouldShowBanner =
    !commonlyBlocked &&
    !isDue &&
    hasDismissedRecently &&
    !isIOSSafariBrowser &&
    !bannerDismissed;

  return {
    platform,
    target,
    shouldShowPopup,
    shouldShowBanner,
    dismiss,
    dismissBanner,
  };
}
