import { Player as IPlayer, GenderType } from '@/lib/api/types';

export type Player = IPlayer;

export interface NewPlayer {
  playerNumber: number;
  name: string;
  phone?: string;
  gender: GenderType;
  level: number | null;
  levelDescription?: string;
  requireConfirmInfo?: boolean;
  userId?: string;
  clubId?: string;
  isClubMember?: boolean;
}
