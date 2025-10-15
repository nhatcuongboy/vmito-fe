import { api, ApiResponse } from './base';
import { ISession, Player } from './types';

export const RealTimeService = {
  // Get real-time session status
  getSessionStatus: async (
    sessionId: string
  ): Promise<{
    session: ISession;
    stats: {
      totalPlayers: number;
      confirmedPlayers: number;
      waitingPlayers: number;
      playingPlayers: number;
      availableCourts: number;
      activeCourts: number;
      activeMatches: number;
    };
    waitStats: {
      averageWaitTime: number;
      maxWaitTime: number;
      minWaitTime: number;
    };
    waitingQueue: (Player & { queuePosition: number })[];
    activeMatches: {
      matchId: string;
      courtNumber: number;
      startTime: Date;
      duration: number;
      players: {
        playerId: string;
        playerNumber: number;
        name: string;
        gender: string;
        level: string;
        position: number;
      }[];
    }[];
    courts: {
      id: string;
      courtNumber: number;
      status: string;
      currentMatch: {
        id: string;
        startTime: Date;
        duration: number;
        playerCount: number;
      } | null;
    }[];
    lastUpdated: string;
  }> => {
    const response = await api.get<ApiResponse<any>>(
      `/sessions/${sessionId}/status`
    );
    return response.data.data!;
  },
};
