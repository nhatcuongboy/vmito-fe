'use client';

import { useEffect } from 'react';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

export default function FeatureFlagsProvider({
  children,
}: FeatureFlagsProviderProps) {
  useEffect(() => {
    useFeatureFlagsStore.getState().fetchFlags();
  }, []);

  return <>{children}</>;
}
