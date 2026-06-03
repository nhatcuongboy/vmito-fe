import { api, ApiResponse } from './base';
import {
  AddTournamentManagerRequest,
  TournamentManager,
  TournamentMyAccess,
  UpdateTournamentManagerRequest,
} from './types';

export const TournamentManagerService = {
  /** Current user's management access (host/admin/manager scopes) to a tournament. */
  getMyAccess: async (idOrSlug: string): Promise<TournamentMyAccess> => {
    const response = await api.get<ApiResponse<TournamentMyAccess>>(
      `/tournaments/${idOrSlug}/my-access`
    );
    return response.data.data!;
  },

  list: async (tournamentId: string): Promise<TournamentManager[]> => {
    const response = await api.get<ApiResponse<TournamentManager[]>>(
      `/tournaments/${tournamentId}/managers`
    );
    return response.data.data || [];
  },

  add: async (
    tournamentId: string,
    data: AddTournamentManagerRequest
  ): Promise<TournamentManager> => {
    const response = await api.post<ApiResponse<TournamentManager>>(
      `/tournaments/${tournamentId}/managers`,
      data
    );
    return response.data.data!;
  },

  updatePermissions: async (
    tournamentId: string,
    userId: string,
    data: UpdateTournamentManagerRequest
  ): Promise<TournamentManager> => {
    const response = await api.patch<ApiResponse<TournamentManager>>(
      `/tournaments/${tournamentId}/managers/${userId}`,
      data
    );
    return response.data.data!;
  },

  remove: async (tournamentId: string, userId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/tournaments/${tournamentId}/managers/${userId}`
    );
  },
};
