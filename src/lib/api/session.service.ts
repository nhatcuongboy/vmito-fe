import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  ISession,
  Court,
  Player,
  Match,
  PlayerStatistics,
  CreateSessionRequest,
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
  getAllSessions: async (): Promise<ISession[]> => {
    const response = await api.get<ApiResponse<ISession[]>>('/sessions');
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
    data: Partial<ISession>
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
    const response = await api.post<ApiResponse<ISession>>(
      `/sessions/${id}/start`
    );
    return response.data.data!;
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

  // Update wait times
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
};
