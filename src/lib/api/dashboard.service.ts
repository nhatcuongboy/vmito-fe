import { api } from './base';
import { ApiResponse } from './types';

export interface DashboardQueryParams {
  from?: string;
  to?: string;
  granularity?: 'day' | 'week' | 'month';
}

export interface TrendBucket {
  bucket: string;
  count: number;
}

export interface UserStatsResponse {
  total: number;
  newInRange: number;
  byRole: { role: string; count: number }[];
  byGender: { gender: string | null; count: number }[];
  trend: TrendBucket[];
}

export interface SessionTournamentStatsResponse {
  sessions: {
    total: number;
    byStatus: { status: string; count: number }[];
    trend: TrendBucket[];
  };
  tournaments: {
    total: number;
    byStatus: { status: string; count: number }[];
    bySportType: { sportType: string; count: number }[];
    trend: TrendBucket[];
  };
}

export interface ClubVenueStatsResponse {
  clubs: {
    total: number;
    byStatus: { status: string; count: number }[];
    trend: TrendBucket[];
  };
  venues: {
    total: number;
    byStatus: { status: string; count: number }[];
    trend: TrendBucket[];
    pendingRequests: number;
    requestsByStatus: { status: string; count: number }[];
  };
  courts: {
    total: number;
    byStatus: { status: string; count: number }[];
  };
}

export const DashboardService = {
  getUserStats: async (
    params?: DashboardQueryParams
  ): Promise<UserStatsResponse> => {
    const response = await api.get<ApiResponse<UserStatsResponse>>(
      '/dashboard/users',
      { params }
    );
    return response.data.data!;
  },

  getSessionTournamentStats: async (
    params?: DashboardQueryParams
  ): Promise<SessionTournamentStatsResponse> => {
    const response = await api.get<ApiResponse<SessionTournamentStatsResponse>>(
      '/dashboard/sessions-tournaments',
      { params }
    );
    return response.data.data!;
  },

  getClubVenueStats: async (
    params?: DashboardQueryParams
  ): Promise<ClubVenueStatsResponse> => {
    const response = await api.get<ApiResponse<ClubVenueStatsResponse>>(
      '/dashboard/clubs-venues',
      { params }
    );
    return response.data.data!;
  },
};
