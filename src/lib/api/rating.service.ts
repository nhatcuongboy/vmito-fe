import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  Rating,
  CreateRatingRequest,
  GetRatingsRequest,
  SessionRatingEligibility,
  UserRatingStats,
} from './types';

export const RatingService = {
  // ==========================================
  // Rating CRUD Operations
  // ==========================================

  // Create a rating (player→host or host→player)
  createRating: async (data: CreateRatingRequest): Promise<Rating> => {
    const response = await api.post<ApiResponse<Rating>>('/ratings', data);
    toaster.success({ title: 'Đã gửi đánh giá thành công' });
    return response.data.data!;
  },

  // Get ratings with filters
  getRatings: async (filters?: GetRatingsRequest): Promise<Rating[]> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.sessionId) params.append('sessionId', filters.sessionId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.raterUserId) params.append('raterUserId', filters.raterUserId);
    if (filters?.ratedUserId) params.append('ratedUserId', filters.ratedUserId);

    const url = params.toString()
      ? `/ratings?${params.toString()}`
      : '/ratings';
    const response = await api.get<ApiResponse<Rating[]>>(url);
    return response.data.data || [];
  },

  // ==========================================
  // Session Rating Eligibility
  // ==========================================

  // Check rating eligibility for current user in a session
  getSessionRatingEligibility: async (
    sessionId: string
  ): Promise<SessionRatingEligibility> => {
    const response = await api.get<ApiResponse<SessionRatingEligibility>>(
      `/ratings/session/${sessionId}/eligibility`
    );
    return (
      response.data.data || {
        canRateHost: false,
        hasRatedHost: false,
        canRatePlayers: [],
        ratedPlayerIds: [],
        playerRatings: [],
      }
    );
  },

  // ==========================================
  // User Rating Statistics
  // ==========================================

  // Get rating statistics for multiple users (batch)
  getBatchUserRatingStats: async (
    userIds: string[]
  ): Promise<UserRatingStats[]> => {
    if (!userIds || userIds.length === 0) {
      return [];
    }
    const response = await api.post<ApiResponse<UserRatingStats[]>>(
      '/ratings/users/batch-stats',
      { userIds }
    );
    return response.data.data || [];
  },

  // Get user's rating statistics
  getUserRatingStats: async (userId: string): Promise<UserRatingStats> => {
    const response = await api.get<
      ApiResponse<
        UserRatingStats & {
          asHost?: { averageRating: number; totalRatings: number };
          asPlayer?: { averageRating: number; totalRatings: number };
        }
      >
    >(`/ratings/user/${userId}/stats`);
    const data = response.data.data;
    if (!data) {
      return { userId, averageRating: 0, totalRatings: 0 };
    }
    return {
      userId: data.userId,
      averageRating: data.averageRating,
      totalRatings: data.totalRatings,
      asHostAverage: data.asHost?.averageRating,
      asHostCount: data.asHost?.totalRatings,
      asPlayerAverage: data.asPlayer?.averageRating,
      asPlayerCount: data.asPlayer?.totalRatings,
    };
  },

  // Get ratings received by a user
  getUserReceivedRatings: async (userId: string): Promise<Rating[]> => {
    const response = await api.get<ApiResponse<Rating[]>>(
      `/ratings/user/${userId}/received`
    );
    return response.data.data || [];
  },

  // Get ratings given by a user
  getUserGivenRatings: async (userId: string): Promise<Rating[]> => {
    const response = await api.get<ApiResponse<Rating[]>>(
      `/ratings/user/${userId}/given`
    );
    return response.data.data || [];
  },
};
