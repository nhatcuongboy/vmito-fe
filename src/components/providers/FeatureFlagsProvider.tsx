'use client';

import { useEffect } from 'react';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

export default function FeatureFlagsProvider({
  children,
}: FeatureFlagsProviderProps) {
  useEffect(() => {
    useFeatureFlagsStore
      .getState()
      .fetchFlags()
      .then(() => {
        // usePreferenceStore seeds useAiForCreation synchronously at module
        // load, before this fetch resolves — resync now that the live value
        // is in, since there's currently no UI for users to override it.
        const { DEFAULT_USE_AI_FOR_CREATION } =
          useFeatureFlagsStore.getState().flags;
        usePreferenceStore
          .getState()
          .setUseAiForCreation(DEFAULT_USE_AI_FOR_CREATION);
      });
  }, []);

  return <>{children}</>;
}
