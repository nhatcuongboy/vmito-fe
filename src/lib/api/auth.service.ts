import { ApiResponse } from '@/lib/api/types';
import { api } from './base';
import { JoinByCodeResponse } from './types';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  ChangePasswordRequest,
} from '@/types/auth';
import { useAuthStore } from '@/stores/useAuthStore';

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

    console.log('Login response:', response.data);

    // Backend wraps response in { success, data }
    const loginData = response.data.data;
    console.log('Login data:', loginData);

    // Save to auth store
    const { user, accessToken, refreshToken } = loginData;
    console.log('User from response:', user);
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);

    return loginData;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Logout - clear local state
   */
  logout: (): void => {
    useAuthStore.getState().clearAuth();
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
