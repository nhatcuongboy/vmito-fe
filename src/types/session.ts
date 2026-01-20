// Common types for the session management components

export type { Player, Court, Match, MatchPlayer } from '@/lib/api/types';

export type PlayerFilter = 'ALL' | 'PLAYING' | 'WAITING' | 'READY' | 'INACTIVE';
