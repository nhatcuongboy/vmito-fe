import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import { PLAYER_VIP_ENABLED } from '@/constants/feature-flags';

/**
 * Hook to check if the current user can access HOST features.
 * Returns true for HOST, ADMIN, or PLAYER when PLAYER_VIP_ENABLED is true.
 */
export const useCanAccessHostFeatures = () => {
  const { user } = useAuthStore();

  const canAccessHostFeatures =
    user?.role === UserRole.HOST ||
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.PLAYER && PLAYER_VIP_ENABLED);

  return { canAccessHostFeatures };
};

/**
 * Standalone utility (non-hook) to check if a given role can access HOST features.
 * Useful in places where hooks cannot be called (e.g., guards, utils).
 */
export const canRoleAccessHostFeatures = (role?: string): boolean =>
  role === UserRole.HOST ||
  role === UserRole.ADMIN ||
  (role === UserRole.PLAYER && PLAYER_VIP_ENABLED);
