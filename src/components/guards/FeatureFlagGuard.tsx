'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/config';
import {
  useFeatureFlagsStore,
  useFeatureFlag,
} from '@/stores/useFeatureFlagsStore';
import AppSplashScreen from '@/components/ui/AppSplashScreen';

interface FeatureFlagGuardProps {
  flag: string;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Guards routes/components behind a feature flag.
 * If the feature flag is disabled, redirects the user (defaults to '/').
 */
export default function FeatureFlagGuard({
  flag,
  children,
  redirectTo = '/',
}: FeatureFlagGuardProps) {
  const router = useRouter();
  const isLoaded = useFeatureFlagsStore((s) => s.isLoaded);
  const isEnabled = useFeatureFlag(flag);

  useEffect(() => {
    if (isLoaded && !isEnabled) {
      router.replace(redirectTo);
    }
  }, [isLoaded, isEnabled, router, redirectTo]);

  if (!isLoaded) {
    return <AppSplashScreen label="Đang tải..." />;
  }

  if (!isEnabled) {
    return null;
  }

  return <>{children}</>;
}
