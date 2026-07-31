import { toaster } from '@/components/ui/toaster';
import { getToastMessage } from '@/lib/i18n/toastMessages';
import { api, ApiResponse } from './base';
import { TournamentPair, CategoryType } from './types';

export const TournamentPairService = {
  // Get all pairs in a tournament
  getPairs: async (tournamentId: string): Promise<TournamentPair[]> => {
    const response = await api.get<ApiResponse<TournamentPair[]>>(
      `/tournaments/${tournamentId}/pairs`
    );
    return response.data.data || [];
  },

  // Get pair by ID
  getPair: async (id: string): Promise<TournamentPair> => {
    const response = await api.get<ApiResponse<TournamentPair>>(
      `/tournament-pairs/${id}`
    );
    return response.data.data!;
  },

  // Create pair
  createPair: async (
    tournamentId: string,
    data: {
      name?: string;
      playerIds: string[];
      type?: CategoryType;
      notes?: string;
    }
  ): Promise<TournamentPair> => {
    const response = await api.post<ApiResponse<TournamentPair>>(
      `/tournaments/${tournamentId}/pairs`,
      data
    );
    toaster.success({ title: getToastMessage('pairCreatedSuccessfully') });
    return response.data.data!;
  },

  // Update pair
  updatePair: async (
    id: string,
    data: {
      name?: string;
      playerIds: string[];
      type?: CategoryType;
      notes?: string;
    }
  ): Promise<TournamentPair> => {
    const response = await api.put<ApiResponse<TournamentPair>>(
      `/tournament-pairs/${id}`,
      data
    );
    toaster.success({ title: getToastMessage('pairUpdatedSuccessfully') });
    return response.data.data!;
  },

  // Delete pair
  deletePair: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-pairs/${id}`);
    toaster.success({ title: getToastMessage('pairDeletedSuccessfully') });
  },

  getPairMatches: async (id: string) => {
    const response = await api.get(`/tournament-pairs/${id}/matches`);
    return response.data.data || [];
  },
};
