import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  BulkPlayerData,
  BulkPlayersInfoResponse,
  BulkPlayersResponse,
  ISession,
  PendingRequest,
  Player,
} from './types';

export const PlayerService = {
  // Get player by ID
  getPlayer: async (id: string): Promise<Player> => {
    const response = await api.get<ApiResponse<Player>>(`/players/${id}`);
    return response.data.data!;
  },

  // Get player by ID for guest (public endpoint)
  getPlayerForGuest: async (id: string): Promise<Player> => {
    const response = await api.get<ApiResponse<Player>>(`/players/guest/${id}`);
    return response.data.data!;
  },

  // Verify player with joinCode and get session data (public endpoint for guest status)
  verifyPlayer: async (
    id: string,
    code: string
  ): Promise<{
    playerId: string;
    sessionId: string;
    verified: boolean;
    session: ISession;
  }> => {
    const response = await api.get<
      ApiResponse<{
        playerId: string;
        sessionId: string;
        verified: boolean;
        session: ISession;
      }>
    >(`/players/guest/${id}/status?code=${code}`);
    return response.data.data!;
  },

  // Create player
  createPlayer: async (
    sessionId: string,
    data: Partial<Player>
  ): Promise<Player> => {
    const response = await api.post<ApiResponse<Player>>(
      `/sessions/${sessionId}/players`,
      data
    );
    toaster.success({ title: 'Player created successfully' });
    return response.data.data!;
  },

  // Create bulk players
  createBulkPlayers: async (
    sessionId: string,
    playersData: BulkPlayerData[]
  ): Promise<BulkPlayersResponse> => {
    const response = await api.post<ApiResponse<BulkPlayersResponse>>(
      `/sessions/${sessionId}/players/bulk`,
      playersData
    );
    toaster.success({
      title: `${
        response.data.data!.createdPlayers.length
      } players created successfully`,
    });
    return response.data.data!;
  },

  // Get bulk players info
  getBulkPlayersInfo: async (
    sessionId: string
  ): Promise<BulkPlayersInfoResponse> => {
    const response = await api.get<ApiResponse<BulkPlayersInfoResponse>>(
      `/sessions/${sessionId}/players/bulk`
    );
    return response.data.data!;
  },

  // Update player
  updatePlayer: async (id: string, data: Partial<Player>): Promise<Player> => {
    const response = await api.put<ApiResponse<Player>>(`/players/${id}`, data);
    toaster.success({ title: 'Player information updated' });
    return response.data.data!;
  },

  // Delete player
  deletePlayer: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/players/${id}`);
    toaster.success({ title: 'Player removed successfully' });
  },

  // Confirm player
  confirmPlayer: async (id: string, data: Partial<Player>): Promise<Player> => {
    const response = await api.post<ApiResponse<Player>>(
      `/players/${id}/confirm`,
      data
    );
    return response.data.data!;
  },

  // @deprecated - Wait times are now calculated automatically from waitingSince timestamp
  // This function is kept for backward compatibility but should not be used
  updateWaitTimes: async (
    sessionId: string,
    minutesToAdd: number = 1
  ): Promise<{ updatedCount: number; players: Player[] }> => {
    console.warn(
      'PlayerService.updateWaitTimes is deprecated. Wait times are now calculated automatically.'
    );
    const response = await api.put<
      ApiResponse<{ updatedCount: number; players: Player[] }>
    >(`/sessions/${sessionId}/wait-times`, {
      minutesToAdd,
    });
    return response.data.data!;
  },

  // Update player by session and player ID
  updatePlayerBySession: async (
    sessionId: string,
    playerId: string,
    data: Partial<Player>
  ): Promise<Player> => {
    const response = await api.patch<ApiResponse<Player>>(
      `/sessions/${sessionId}/players/${playerId}`,
      data
    );
    toaster.success({ title: 'Player updated successfully' });
    return response.data.data!;
  },

  // Delete player by session and player ID
  deletePlayerBySession: async (
    sessionId: string,
    playerId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/sessions/${sessionId}/players/${playerId}`
    );
    toaster.success({ title: 'Player deleted successfully' });
  },

  // Bulk update players
  bulkUpdatePlayers: async (
    sessionId: string,
    players: Partial<Player>[]
  ): Promise<{ updatedPlayers: Player[] }> => {
    const response = await api.patch<ApiResponse<{ updatedPlayers: Player[] }>>(
      `/sessions/${sessionId}/players/bulk-update`,
      { players }
    );
    toaster.success({ title: 'Players updated successfully' });
    return response.data.data!;
  },

  // Get sessions that the current user has participated in
  getMySessions: async (filters?: {
    page?: number;
    limit?: number;
    searchQuery?: string;
  }): Promise<{
    data: ISession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery);

    const url = params.toString()
      ? `/players/me/sessions?${params.toString()}`
      : '/players/me/sessions';
    const response = await api.get<
      ApiResponse<{
        data: ISession[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(url);
    return (
      response.data.data || {
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      }
    );
  },

  // Register players for a session
  registerPlayers: async (
    sessionId: string,
    players: Partial<Player>[]
  ): Promise<{ createdPlayers: Player[]; message: string }> => {
    const response = await api.post<
      ApiResponse<{ createdPlayers: Player[]; message: string }>
    >(`/sessions/${sessionId}/players/register`, { players });
    toaster.success({ title: response.data.data!.message });
    return response.data.data!;
  },

  // Update player registration status
  updatePlayerStatus: async (
    sessionId: string,
    playerId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<Player> => {
    const response = await api.patch<ApiResponse<Player>>(
      `/sessions/${sessionId}/players/${playerId}/status`,
      { status }
    );
    toaster.success({ title: `Player ${status.toLowerCase()} successfully` });
    return response.data.data!;
  },

  // Get user's registration status across all sessions
  getMyRegistrations: async (): Promise<
    {
      sessionId: string;
      playerId: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }[]
  > => {
    const response = await api.get<
      ApiResponse<
        {
          sessionId: string;
          playerId: string;
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
        }[]
      >
    >('/players/me/registrations');
    return response.data.data || [];
  },

  // Get user's registered players for a specific session
  getMyPlayersForSession: async (sessionId: string): Promise<Player[]> => {
    const response = await api.get<ApiResponse<Player[]>>(
      `/sessions/${sessionId}/players/me`
    );
    return response.data.data || [];
  },

  // Get pending requests for host (paginated)
  getPendingRequests: async (filters?: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: PendingRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = params.toString()
      ? `/players/pending-requests?${params.toString()}`
      : '/players/pending-requests';
    const response = await api.get<
      ApiResponse<{
        data: PendingRequest[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >(url);
    return response.data.data || { data: [], total: 0, page: 1, totalPages: 0 };
  },

  // Get count of pending requests for host
  getPendingRequestsCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>(
      '/players/pending-requests/count'
    );
    return response.data.data?.count || 0;
  },

  // Batch approve/reject pending requests
  batchUpdateStatus: async (
    playerIds: string[],
    status: 'APPROVED' | 'REJECTED'
  ): Promise<{ updated: number; status: string }> => {
    const response = await api.post<
      ApiResponse<{ updated: number; status: string }>
    >('/players/pending-requests/batch', { playerIds, status });
    return response.data.data!;
  },
};
