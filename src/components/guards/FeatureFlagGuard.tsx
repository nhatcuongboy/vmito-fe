'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/config';

interface FeatureFlagGuardProps {
  enabled: boolean;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Guards routes/components behind a feature flag.
 * If the feature flag is disabled, redirects the user (defaults to '/').
 */
export default function FeatureFlagGuard({
  enabled,
  children,
  redirectTo = '/',
}: FeatureFlagGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      router.replace(redirectTo);
    }
  }, [enabled, router, redirectTo]);

  if (!enabled) {
    return null;
  }

  return <>{children}</>;
}
