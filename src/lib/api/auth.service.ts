import type { ApiResponse } from '@/lib/api/types';
import { api } from './base';
import { JoinByCodeResponse } from './types';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTourStore } from '@/stores/useTourStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

// Auth service - connects to NestJS backend
export const AuthService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>(
      '/auth/login',
      credentials
    );

    // Backend wraps response in { success, data }
    const loginData = response.data.data;

    // Save to auth store
    const { user, accessToken, refreshToken } = loginData;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);

    return loginData;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest, locale?: string): Promise<User> => {
    const query = locale ? `?locale=${locale}` : '';
    const response = await api.post<User>(`/auth/register${query}`, data);
    return response.data;
  },

  /**
   * Logout - clear local state
   */
  logout: (): void => {
    useAuthStore.getState().clearAuth();
    // Use reset to clear notification state on logout
    useNotificationStore.getState().reset();
    // Clear per-user product tour progress so it doesn't leak to the next
    // account signing in on the same browser.
    useTourStore.getState().reset();
    // Reset onboarding/AI-creation flags so a new user gets a clean
    // onboarding flow; preferredCity is intentionally kept (see store).
    usePreferenceStore.getState().resetPreferences();
  },

  /**
   * Get new token (refresh)
   */
  refreshToken: async (): Promise<LoginResponse> => {
    // Get current refresh token from store
    const currentRefreshToken = useAuthStore.getState().refreshToken;

    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken: currentRefreshToken,
    });

    // Update token in store
    const { accessToken, refreshToken } = response.data;
    useAuthStore.getState().updateToken(accessToken, refreshToken);

    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (
    data: ChangePasswordRequest
  ): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(
      '/auth/change-password',
      data
    );
    return response.data;
  },

  /**
   * Request a password reset email.
   */
  forgotPassword: async (
    data: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      data,
      { skipGlobalError: true }
    );
    return response.data;
  },

  /**
   * Reset password using the token from the email link.
   */
  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    const response = await api.put<ResetPasswordResponse>(
      '/auth/reset-password',
      data,
      { skipGlobalError: true }
    );
    return response.data;
  },

  /**
   * Verify password reset token and get masked email.
   */
  verifyResetToken: async (
    token: string
  ): Promise<{ valid: boolean; maskedEmail: string }> => {
    const response = await api.get<
      ApiResponse<{ valid: boolean; maskedEmail: string }>
    >(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
      skipGlobalError: true,
    });

    const result = response.data.data;
    if (!result) {
      throw new Error('Verify reset token response is missing data');
    }

    return result;
  },

  /**
   * Get current user from store
   */
  getCurrentUser: (): User | null => {
    return useAuthStore.getState().user;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return useAuthStore.getState().isAuthenticated;
  },

  /**
   * Check code validation (for guest join)
   */
  checkCode: async (
    code: string
  ): Promise<{
    isPlayerCode: boolean;
    playerId: string | null;
    sessionId: string | null;
  }> => {
    const response = await api.get<
      ApiResponse<{
        isPlayerCode: boolean;
        playerId: string | null;
        sessionId: string | null;
      }>
    >(`/players/check-code?code=${code}`);
    return response.data.data!;
  },

  /**
   * Join session by code (guest flow)
   */
  joinByCode: async (
    sessionCode: string,
    playerInfo?: {
      name?: string;
      gender?: string;
      level?: number;
      phone?: string;
    }
  ): Promise<ApiResponse<JoinByCodeResponse>> => {
    const response = await api.post<ApiResponse<JoinByCodeResponse>>(
      '/players/join-by-code',
      {
        sessionCode: sessionCode.trim().toUpperCase(),
        ...playerInfo,
      }
    );
    return response.data;
  },
};
