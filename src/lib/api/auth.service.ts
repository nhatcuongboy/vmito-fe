import { ApiResponse, Level } from '@/lib/api/types';
import { api } from './base';
import { JoinByCodeResponse } from './types';

// Auth service
export const AuthService = {
  // Check if code is valid player code
  checkCode: async (code: string): Promise<{ isPlayerCode: boolean }> => {
    const response = await api.get<ApiResponse<{ isPlayerCode: boolean }>>(
      `/players/check-code?code=${code}`
    );
    return response.data.data!;
  },

  // Join session by code
  joinByCode: async (
    sessionCode: string,
    playerInfo?: {
      name?: string;
      gender?: string;
      level?: Level;
      phone?: string;
    }
  ): Promise<ApiResponse<JoinByCodeResponse>> => {
    const response = await api.post<ApiResponse<JoinByCodeResponse>>(
      '/join-by-code',
      {
        sessionCode: sessionCode.trim().toUpperCase(),
        ...playerInfo,
      }
    );
    return response.data;
  },
};
