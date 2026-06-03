import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import { TournamentPlayer, CategoryMatch, GenderType } from './types';

export type CreateTournamentPlayerPayload = {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  imagePublicId?: string;
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  userId?: string;
};

export type UpdateTournamentPlayerPayload = {
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  imagePublicId?: string;
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  userId?: string;
};

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
    data: CreateTournamentPlayerPayload,
    options?: { showToast?: boolean }
  ): Promise<TournamentPlayer> => {
    const response = await api.post<ApiResponse<TournamentPlayer>>(
      `/tournaments/${tournamentId}/players`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Player created successfully' });
    }
    return response.data.data!;
  },

  // Update player
  updatePlayer: async (
    id: string,
    data: UpdateTournamentPlayerPayload,
    options?: { showToast?: boolean }
  ): Promise<TournamentPlayer> => {
    const response = await api.put<ApiResponse<TournamentPlayer>>(
      `/tournament-players/${id}`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Player updated successfully' });
    }
    return response.data.data!;
  },

  // Delete player
  deletePlayer: async (
    id: string,
    options?: { showToast?: boolean }
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-players/${id}`);
    if (options?.showToast !== false) {
      toaster.success({ title: 'Player deleted successfully' });
    }
  },
};
