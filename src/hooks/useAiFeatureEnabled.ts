import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';

/**
 * Hook to check whether AI features are enabled site-wide (AI Assistant,
 * "Create by AI", session AI analysis, AI-powered court matching, etc.),
 * driven by the `AI_FEATURE_ENABLED` feature flag. Returns false until the
 * flags have finished loading, so AI UI doesn't flash on before the real
 * value comes back.
 */
export const useAiFeatureEnabled = () =>
  useFeatureFlagsStore((s) => s.isLoaded && s.flags.AI_FEATURE_ENABLED);

/**
 * Standalone utility (non-hook) to read the flag outside React (e.g. in
 * plain functions or store getters).
 */
export const isAiFeatureEnabled = (): boolean => {
  const { isLoaded, flags } = useFeatureFlagsStore.getState();
  return isLoaded && flags.AI_FEATURE_ENABLED;
};
