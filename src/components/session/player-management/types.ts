import { Level } from '@/lib/api/types';

export interface Player {
  id: string;
  playerNumber: number;
  name: string;
  gender?: string;
  level?: Level;
  status: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
  levelDescription?: string;
  requireConfirmInfo?: boolean;
}

export interface NewPlayer {
  playerNumber: number;
  name: string;
  gender: string;
  level: Level;
  levelDescription?: string;
  requireConfirmInfo?: boolean;
  userId?: string;
}
