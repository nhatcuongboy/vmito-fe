/* eslint-disable @typescript-eslint/no-explicit-any */
import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  ISession,
  Court,
  Player,
  Match,
  PlayerStatistics,
  CreateSessionRequest,
  BulkSessionCreationRequest,
  BulkSessionCreationResponse,
} from './types';

export const SessionService = {
  // Get player statistics for a session
  getPlayerStatistics: async (
    sessionId: string,
    options?: {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      gender?: string;
      level?: string;
      status?: string;
    }
  ): Promise<{
    sessionId: string;
    playerStats: PlayerStatistics[];
    filters: {
      gender?: string;
      level?: string;
      status?: string;
      sortBy: string;
      sortOrder: string;
    };
    lastUpdated: string;
  }> => {
    const params = new URLSearchParams();
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options?.gender) params.append('gender', options.gender);
    if (options?.level) params.append('level', options.level);
    if (options?.status) params.append('status', options.status);

    const url = `/sessions/${sessionId}/players/statistics${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    const response = await api.get<
      ApiResponse<{
        sessionId: string;
        playerStats: PlayerStatistics[];
        filters: {
          gender?: string;
          level?: string;
          status?: string;
          sortBy: string;
          sortOrder: string;
        };
        lastUpdated: string;
      }>
    >(url);
    return response.data.data!;
  },

  // Get all sessions
  getAllSessions: async (filters?: {
    page?: number;
    limit?: number;
    hostId?: string;
    searchQuery?: string;
  }): Promise<ISession[]> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.hostId) params.append('hostId', filters.hostId);
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);

    const url = params.toString()
      ? `/sessions?${params.toString()}`
      : '/sessions';
    const response = await api.get<ApiResponse<ISession[]>>(url);
    return response.data.data || [];
  },

  // Get available sessions
  getAvailableSessions: async (filters?: {
    date?: string;
    level?: number;
    city?: string;
    district?: string;
    minFee?: number;
    maxFee?: number;
    hasSlots?: boolean;
    minAvailableSlots?: number;
    searchQuery?: string;
    lat?: number;
    lng?: number;
    sortByDistance?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ISession[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.level) params.append('level', filters.level.toString());
    if (filters?.city) params.append('city', filters.city);
    if (filters?.district) params.append('district', filters.district);
    if (filters?.minFee !== undefined)
      params.append('minFee', filters.minFee.toString());
    if (filters?.maxFee !== undefined)
      params.append('maxFee', filters.maxFee.toString());
    if (filters?.hasSlots !== undefined)
      params.append('hasSlots', filters.hasSlots.toString());
    if (filters?.minAvailableSlots !== undefined)
      params.append('minAvailableSlots', filters.minAvailableSlots.toString());
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);
    if (filters?.lat !== undefined)
      params.append('lat', filters.lat.toString());
    if (filters?.lng !== undefined)
      params.append('lng', filters.lng.toString());
    if (filters?.sortByDistance !== undefined)
      params.append('sortByDistance', filters.sortByDistance.toString());
    if (filters?.page !== undefined)
      params.append('page', filters.page.toString());
    if (filters?.limit !== undefined)
      params.append('limit', filters.limit.toString());

    const url = params.toString()
      ? `/sessions/available?${params.toString()}`
      : `/sessions/available`;

    const response = await api.get<ApiResponse<ISession[]>>(url);
    return response.data.data || [];
  },

  // Get session by ID
  /**
   * Get a session by ID
   * @param id - Session ID
   * @returns Session object including requiredLevels field (if set)
   */
  getSession: async (id: string): Promise<ISession> => {
    const response = await api.get<ApiResponse<ISession>>(`/sessions/${id}`);
    return response.data.data!;
  },

  // Create session
  /**
   * Create a new session
   * @param data - Session creation data including optional requiredLevels
   * @param data.requiredLevels - Optional array of Level enum values. Empty array or undefined = all levels allowed
   * @returns Created session object with requiredLevels field
   */
  createSession: async (data: CreateSessionRequest): Promise<ISession> => {
    const response = await api.post<ApiResponse<ISession>>('/sessions', data);
    return response.data.data!;
  },

  // Create multiple sessions at once
  /**
   * Create multiple sessions at once (bulk creation)
   * @param data - Bulk session creation data with mode (single, specific-dates, recurring-weekdays)
   * @returns Response with created sessions or errors
   */
  createBulkSessions: async (
    data: BulkSessionCreationRequest
  ): Promise<BulkSessionCreationResponse> => {
    const response = await api.post<ApiResponse<BulkSessionCreationResponse>>(
      '/sessions/bulk',
      data
    );
    return response.data.data!;
  },

  // Update session
  /**
   * Update an existing session
   * @param id - Session ID
   * @param data - Partial session data including optional requiredLevels
   * @param data.requiredLevels - Optional array of Level enum values. Empty array or undefined = all levels allowed
   * @returns Updated session object with requiredLevels field
   */
  updateSession: async (
    id: string,
    data: Partial<CreateSessionRequest>
  ): Promise<ISession> => {
    const response = await api.put<ApiResponse<ISession>>(
      `/sessions/${id}`,
      data
    );
    return response.data.data!;
  },

  // Delete session
  deleteSession: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/sessions/${id}`);
  },

  // Start session
  startSession: async (id: string): Promise<ISession> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/sessions/${id}/start`
    );
    return response.data.data as ISession;
  },

  // End session
  endSession: async (
    id: string
  ): Promise<{ session: ISession; statistics: any }> => {
    const response = await api.post<
      ApiResponse<{ session: ISession; statistics: any }>
    >(`/sessions/${id}/end`);
    return response.data.data!;
  },

  // Migrate/fix old ended sessions
  migrateEndedSession: async (
    id: string
  ): Promise<{
    session: ISession;
    statistics: any;
    migrationResults: {
      unfinishedMatchesFixed: number;
      playersUpdated: number;
      courtsUpdated: number;
    };
  }> => {
    const response = await api.post<
      ApiResponse<{
        session: ISession;
        statistics: any;
        migrationResults: any;
      }>
    >(`/sessions/${id}/migrate-end`);
    toaster.success({ title: 'ISession migration completed successfully' });
    return response.data.data!;
  },

  // Update session status
  updateSessionStatus: async (
    id: string,
    status: string
  ): Promise<ISession> => {
    const response = await api.patch<ApiResponse<ISession>>(
      `/sessions/${id}/status`,
      { status }
    );
    return response.data.data!;
  },

  // Get session courts
  getSessionCourts: async (id: string): Promise<Court[]> => {
    const response = await api.get<ApiResponse<Court[]>>(
      `/sessions/${id}/courts`
    );
    return response.data.data || [];
  },

  // Get session players
  getSessionPlayers: async (
    id: string,
    params?: { status?: string; orderBy?: string; orderDir?: string }
  ): Promise<Player[]> => {
    const response = await api.get<ApiResponse<Player[]>>(
      `/sessions/${id}/players`,
      { params }
    );
    return response.data.data || [];
  },

  // Get waiting queue
  getWaitingQueue: async (id: string): Promise<Player[]> => {
    const response = await api.get<ApiResponse<Player[]>>(
      `/sessions/${id}/waiting-queue`
    );
    return response.data.data || [];
  },

  // Get session matches
  getSessionMatches: async (id: string): Promise<Match[]> => {
    const response = await api.get<
      ApiResponse<{
        matches: Match[];
        totalMatches: number;
        filters: {
          playerId: string | null;
          courtId: string | null;
        };
      }>
    >(`/sessions/${id}/matches`);
    return response.data.data?.matches || [];
  },

  // Toggle player inactive status
  togglePlayerInactive: async (
    sessionId: string,
    playerId: string
  ): Promise<Player> => {
    const response = await api.patch<ApiResponse<Player>>(
      `/sessions/${sessionId}/players/toggle-inactive`,
      { playerId }
    );
    return response.data.data!;
  },

  // Get session matches with filters
  getSessionMatchesWithFilters: async (
    id: string,
    filters?: { playerId?: string; courtId?: string }
  ): Promise<{
    matches: Match[];
    totalMatches: number;
    filters: {
      playerId: string | null;
      courtId: string | null;
    };
  }> => {
    const params = new URLSearchParams();
    if (filters?.playerId) params.append('playerId', filters.playerId);
    if (filters?.courtId) params.append('courtId', filters.courtId);

    const url = params.toString()
      ? `/sessions/${id}/matches?${params.toString()}`
      : `/sessions/${id}/matches`;

    const response = await api.get<
      ApiResponse<{
        matches: Match[];
        totalMatches: number;
        filters: any;
      }>
    >(url);

    return response.data.data!;
  },

  // @deprecated - Wait times are now calculated automatically from waitingSince
  // Keeping for reset functionality only
  updateWaitTimes: async (
    id: string,
    data: {
      minutesToAdd?: number;
      resetType?: 'current' | 'total' | 'both';
      playerIds?: string[];
    }
  ): Promise<void> => {
    await api.put(`/sessions/${id}/wait-times`, data);
  },

  // Update match details
  updateMatch: async (
    id: string,
    data: Partial<Match> & { playerIds?: string[] }
  ): Promise<Match> => {
    const response = await api.patch<ApiResponse<Match>>(
      `/matches/${id}`,
      data
    );
    return response.data.data!;
  },

  // Upload cover photo for session
  uploadCoverPhoto: async (
    sessionId: string,
    file: File
  ): Promise<ISession> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<ISession>>(
      `/sessions/${sessionId}/cover-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  // Delete cover photo for session
  deleteCoverPhoto: async (sessionId: string): Promise<ISession> => {
    const response = await api.delete<ApiResponse<ISession>>(
      `/sessions/${sessionId}/cover-photo`
    );
    return response.data.data!;
  },
};
