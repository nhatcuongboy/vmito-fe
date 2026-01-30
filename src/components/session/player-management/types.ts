export type { Player } from '@/lib/api/types';

export interface NewPlayer {
  playerNumber: number;
  name: string;
  gender: string;
  level: number | null;
  levelDescription?: string;
  requireConfirmInfo?: boolean;
  userId?: string;
}
