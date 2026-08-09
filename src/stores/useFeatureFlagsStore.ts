import { create } from 'zustand';
import { FeatureFlagsService } from '@/lib/api/feature-flags.service';
import { FEATURE_FLAG_DEFAULTS } from '@/constants/feature-flags';

interface FeatureFlagsState {
  flags: Record<string, boolean>;
  isLoaded: boolean;
  fetchFlags: () => Promise<void>;
}

/** Helper to resolve flag value supporting case sensitivity and common key aliases. */
export function getFeatureFlagValue(
  flags: Record<string, boolean>,
  key: string
): boolean {
  if (key in flags) return Boolean(flags[key]);
  const upper = key.toUpperCase();
  if (upper in flags) return Boolean(flags[upper]);
  const lower = key.toLowerCase();
  if (lower in flags) return Boolean(flags[lower]);

  // Common aliases for classes feature flag
  if (
    key === 'CLASSES_FEATURE_ENABLED' ||
    key === 'CLASSES_ENABLED' ||
    key === 'ENABLE_CLASSES_FEATURE' ||
    key === 'ENABLE_CLASSES'
  ) {
    for (const alias of [
      'CLASSES_FEATURE_ENABLED',
      'CLASSES_ENABLED',
      'ENABLE_CLASSES_FEATURE',
      'ENABLE_CLASSES',
      'classes_feature_enabled',
      'classes_enabled',
    ]) {
      if (alias in flags) return Boolean(flags[alias]);
    }
  }

  return false;
}

/** Global feature flags fetched from GET /feature-flags. Reads use
 *  `getState()` outside React (e.g. in non-hook guards), or the store as a
 *  hook for reactive updates. Falls back to FEATURE_FLAG_DEFAULTS until the
 *  fetch resolves or if it fails. */
export const useFeatureFlagsStore = create<FeatureFlagsState>()((set) => ({
  flags: FEATURE_FLAG_DEFAULTS,
  isLoaded: false,

  fetchFlags: async () => {
    try {
      const flags = await FeatureFlagsService.getAll();
      set({ flags: { ...FEATURE_FLAG_DEFAULTS, ...flags }, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
}));

/** Custom hook to read a specific feature flag reactively from API / store. */
export function useFeatureFlag(key: string): boolean {
  return useFeatureFlagsStore((s) => getFeatureFlagValue(s.flags, key));
}
