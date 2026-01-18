import { api, ApiResponse } from './base';
import { Player } from './types';

export const WaitTimeService = {
  // Get wait time statistics (wait times are now calculated automatically from waitingSince)
  getWaitTimeStats: async (
    sessionId: string
  ): Promise<{
    stats: {
      totalPlayers: number;
      waitingPlayers: number;
      playingPlayers: number;
      averageWaitTime: number;
      maxWaitTime: number;
      minWaitTime: number;
      totalWaitTime: number;
      averageTotalWaitTime: number;
    };
    waitingPlayers: Player[];
    playingPlayers: Player[];
    lastUpdated: string;
  }> => {
    const response = await api.get<
      ApiResponse<{
        stats: {
          totalPlayers: number;
          waitingPlayers: number;
          playingPlayers: number;
          averageWaitTime: number;
          maxWaitTime: number;
          minWaitTime: number;
          totalWaitTime: number;
          averageTotalWaitTime: number;
        };
        waitingPlayers: Player[];
        playingPlayers: Player[];
        lastUpdated: string;
      }>
    >(`/sessions/${sessionId}/wait-times`);
    return response.data.data!;
  },

  // Reset wait times (using the update endpoint with 0 minutes)
  resetWaitTimes: async (
    sessionId: string,
    playerIds: string[],
    resetType: 'current' | 'total' | 'both' = 'current'
  ): Promise<{
    updatedCount: number;
    players: Player[];
    resetType: string;
  }> => {
    const response = await api.put<
      ApiResponse<{
        updatedCount: number;
        players: Player[];
        minutesAdded: number;
      }>
    >(`/sessions/${sessionId}/wait-times`, {
      minutesToAdd: 0,
      resetType,
      playerIds,
    });
    return {
      updatedCount: response.data.data!.updatedCount,
      players: response.data.data!.players,
      resetType,
    };
  },
};
