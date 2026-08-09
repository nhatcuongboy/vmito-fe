import type { TRankingTier } from '@/lib/api/ranking.service';

export const SESSION_POINT_RULES = [
  { reason: 'SESSION_MATCH_WIN', points: 10 },
  { reason: 'SESSION_MATCH_DRAW', points: 5 },
  { reason: 'SESSION_MATCH_LOSS', points: 2 },
  { reason: 'SESSION_PARTICIPATION', points: 5 },
] as const;

export const TOURNAMENT_POINT_RULES = [
  { reason: 'TOURNAMENT_MATCH_WIN', points: 20 },
  { reason: 'TOURNAMENT_MATCH_DRAW', points: 10 },
  { reason: 'TOURNAMENT_MATCH_LOSS', points: 5 },
  { reason: 'TOURNAMENT_CHAMPION', points: 100 },
  { reason: 'TOURNAMENT_RUNNER_UP', points: 60 },
  { reason: 'TOURNAMENT_SEMIFINALIST', points: 30 },
] as const;

export const RANKING_TIERS: { tier: TRankingTier; minPoints: number }[] = [
  { tier: 'DIAMOND', minPoints: 10000 },
  { tier: 'PLATINUM', minPoints: 4000 },
  { tier: 'GOLD', minPoints: 1500 },
  { tier: 'SILVER', minPoints: 500 },
  { tier: 'BRONZE', minPoints: 0 },
];
