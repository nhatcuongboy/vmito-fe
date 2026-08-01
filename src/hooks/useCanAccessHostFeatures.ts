import { useAuthStore } from '@/stores/useAuthStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { UserRole } from '@/lib/api/types';

/**
 * Hook to check if the current user can access HOST features.
 * Returns true for HOST, ADMIN, or PLAYER/REFEREE when the PLAYER_VIP_ENABLED
 * feature flag is on.
 */
export const useCanAccessHostFeatures = () => {
  const { user } = useAuthStore();
  const playerVipEnabled = useFeatureFlagsStore(
    (s) => s.flags.PLAYER_VIP_ENABLED
  );

  const canAccessHostFeatures =
    user?.role === UserRole.HOST ||
    user?.role === UserRole.ADMIN ||
    ((user?.role === UserRole.PLAYER || user?.role === UserRole.REFEREE) &&
      playerVipEnabled);

  return { canAccessHostFeatures };
};

/**
 * Standalone utility (non-hook) to check if a given role can access HOST features.
 * Useful in places where hooks cannot be called (e.g., guards, utils).
 */
export const canRoleAccessHostFeatures = (role?: string): boolean =>
  role === UserRole.HOST ||
  role === UserRole.ADMIN ||
  ((role === UserRole.PLAYER || role === UserRole.REFEREE) &&
    useFeatureFlagsStore.getState().flags.PLAYER_VIP_ENABLED);
