import toast from 'react-hot-toast';
import { api, ApiResponse } from './base';
import { TournamentPlayer, Level, CategoryMatch } from './types';

export const TournamentPlayerService = {
  // Get all players in a tournament
  getPlayers: async (tournamentId: string): Promise<TournamentPlayer[]> => {
    const response = await api.get<ApiResponse<TournamentPlayer[]>>(
      `/tournaments/${tournamentId}/players`
    );
    return response.data.data || [];
  },

  // Get player by ID
  getPlayer: async (id: string): Promise<TournamentPlayer> => {
    const response = await api.get<ApiResponse<TournamentPlayer>>(
      `/tournament-players/${id}`
    );
    return response.data.data!;
  },

  // Get player matches
  getPlayerMatches: async (id: string): Promise<CategoryMatch[]> => {
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/tournament-players/${id}/matches`
    );
    return response.data.data || [];
  },

  // Create player
  createPlayer: async (
    tournamentId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
      level?: Level;
      levelDescription?: string;
      userId?: string;
    }
  ): Promise<TournamentPlayer> => {
    const response = await api.post<ApiResponse<TournamentPlayer>>(
      `/tournaments/${tournamentId}/players`,
      data
    );
    toast.success('Player created successfully');
    return response.data.data!;
  },

  // Update player
  updatePlayer: async (
    id: string,
    data: Partial<TournamentPlayer>
  ): Promise<TournamentPlayer> => {
    const response = await api.put<ApiResponse<TournamentPlayer>>(
      `/tournament-players/${id}`,
      data
    );
    toast.success('Player updated successfully');
    return response.data.data!;
  },

  // Delete player
  deletePlayer: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-players/${id}`);
    toast.success('Player deleted successfully');
  },
};

