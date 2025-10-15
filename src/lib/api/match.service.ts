import { api, ApiResponse } from './base';
import { Match } from './types';

export const MatchService = {
  // Get session matches
  getSessionMatches: async (
    sessionId: string
  ): Promise<{
    matches: Match[];
    totalMatches: number;
    activeMatches: number;
    completedMatches: number;
  }> => {
    const response = await api.get<
      ApiResponse<{
        matches: Match[];
        totalMatches: number;
        activeMatches: number;
        completedMatches: number;
      }>
    >(`/sessions/${sessionId}/matches`);
    return response.data.data!;
  },

  // Create match
  createMatch: async (
    sessionId: string,
    data: { courtId: string; playerIds: string[] }
  ): Promise<{ match: Match; message: string }> => {
    const response = await api.post<
      ApiResponse<{
        match: Match;
        message: string;
      }>
    >(`/sessions/${sessionId}/matches`, data);
    return response.data.data!;
  },

  // End match
  endMatch: async (sessionId: string, matchId: string): Promise<Match> => {
    const response = await api.patch<ApiResponse<Match>>(
      `/sessions/${sessionId}/matches/${matchId}/end`
    );
    return response.data.data!;
  },

  // Auto-assign players
  autoAssignPlayers: async (
    sessionId: string,
    options?: {
      strategy?: 'fairness' | 'speed' | 'level_balance';
      maxPlayersPerCourt?: number;
    }
  ): Promise<{
    matches: Match[];
    strategy: string;
    assignedPlayers: number;
    courtsUsed: number;
    message: string;
  }> => {
    const response = await api.post<
      ApiResponse<{
        matches: Match[];
        strategy: string;
        assignedPlayers: number;
        courtsUsed: number;
        message: string;
      }>
    >(`/sessions/${sessionId}/auto-assign`, options || {});
    return response.data.data!;
  },
};
