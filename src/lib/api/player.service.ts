import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  BulkPlayerData,
  BulkPlayersInfoResponse,
  BulkPlayersResponse,
  ISession,
  Player,
} from './types';

export const PlayerService = {
  // Get player by ID
  getPlayer: async (id: string): Promise<Player> => {
    const response = await api.get<ApiResponse<Player>>(`/players/${id}`);
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
    toaster.success({ title: 
      `${
        response.data.data!.createdPlayers.length
      } players created successfully`
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

  // Update wait times (deprecated - use WaitTimeService.updateSessionWaitTimes instead)
  updateWaitTimes: async (
    sessionId: string,
    minutesToAdd: number = 1
  ): Promise<{ updatedCount: number; players: Player[] }> => {
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
  getMySessions: async (): Promise<ISession[]> => {
    const response = await api.get<ApiResponse<ISession[]>>(
      '/players/me/sessions'
    );
    return response.data.data || [];
  },
};
