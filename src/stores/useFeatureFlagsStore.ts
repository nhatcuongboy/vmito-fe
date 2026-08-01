import { create } from 'zustand';
import { FeatureFlagsService } from '@/lib/api/feature-flags.service';
import { FEATURE_FLAG_DEFAULTS } from '@/constants/feature-flags';

interface FeatureFlagsState {
  flags: Record<string, boolean>;
  isLoaded: boolean;
  fetchFlags: () => Promise<void>;
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
