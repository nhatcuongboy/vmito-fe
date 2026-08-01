import { api, ApiResponse } from './base';

export type TLeaderboardPeriod = 'week' | 'month' | 'year' | 'all';
export type TRankingTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND';

export interface ILeaderboardUser {
  id: string;
  name: string | null;
  image: string | null;
  level: number | null;
}

export interface ILeaderboardEntry {
  rank: number;
  points: number;
  user: ILeaderboardUser;
  tier: TRankingTier;
  matchesWon: number;
  matchesPlayed: number;
}

export interface ILeaderboardResponse {
  sport: string;
  period: TLeaderboardPeriod;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  entries: ILeaderboardEntry[];
}

export interface IPeriodRank {
  period: TLeaderboardPeriod;
  points: number;
  rank: number | null;
}

export interface IPointTransaction {
  id: string;
  points: number;
  reason: string;
  refType: string;
  refId: string;
  occurredAt: string;
}

export interface IUserAchievements {
  sport: string;
  totalPoints: number;
  tier: TRankingTier;
  nextTier: { nextTier: TRankingTier; pointsToNext: number } | null;
  ranks: IPeriodRank[];
  stats: {
    wins: number;
    draws: number;
    losses: number;
    matchesPlayed: number;
    sessionsPlayed: number;
    sessionsHosted: number;
    tournamentTitles: number;
    tournamentRunnerUps: number;
  };
  recentTransactions: IPointTransaction[];
}

export interface IPointValueRow {
  reason: string;
  points: number;
  transactions: number;
  totalPoints: number;
}

export interface ITierRow {
  tier: TRankingTier;
  minPoints: number;
  users: number;
}

export interface IPointsAdminOverview {
  config: {
    hostMinActivePlayers: number;
    pointValues: IPointValueRow[];
    tiers: ITierRow[];
  };
  stats: {
    totalTransactions: number;
    totalPoints: number;
    rankedUsers: number;
    lastOccurredAt: string | null;
    lastAwardedAt: string | null;
    finishedSessions: number;
    finishedMatches: number;
    finishedTournaments: number;
  };
}

export interface IBackfillResult {
  candidates: number;
  inserted: number;
  usersUpdated: number;
}

export const RankingService = {
  getLeaderboard: async (params?: {
    period?: TLeaderboardPeriod;
    page?: number;
    limit?: number;
  }): Promise<ILeaderboardResponse> => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const url = query.toString()
      ? `/leaderboard?${query.toString()}`
      : '/leaderboard';
    const response = await api.get<ApiResponse<ILeaderboardResponse>>(url);
    return response.data.data!;
  },

  getMyRanks: async (): Promise<IPeriodRank[]> => {
    const response =
      await api.get<ApiResponse<IPeriodRank[]>>('/leaderboard/me');
    return response.data.data ?? [];
  },

  getUserAchievements: async (userId: string): Promise<IUserAchievements> => {
    const response = await api.get<ApiResponse<IUserAchievements>>(
      `/leaderboard/users/${userId}/achievements`
    );
    return response.data.data!;
  },

  /** Admin only. */
  getAdminOverview: async (): Promise<IPointsAdminOverview> => {
    const response = await api.get<ApiResponse<IPointsAdminOverview>>(
      '/leaderboard/admin/overview'
    );
    return response.data.data!;
  },

  /** Admin only. Idempotent: existing transactions are skipped. */
  runBackfill: async (): Promise<IBackfillResult> => {
    const response = await api.post<ApiResponse<IBackfillResult>>(
      '/leaderboard/backfill'
    );
    return response.data.data!;
  },
};
