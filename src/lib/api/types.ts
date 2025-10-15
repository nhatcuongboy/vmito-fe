// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User roles
export enum UserRole {
  HOST = 'HOST',
  GUEST = 'GUEST',
  PLAYER = 'PLAYER',
}

// Level enum
export enum Level {
  Y_MINUS = 'Y_MINUS',
  Y = 'Y',
  Y_PLUS = 'Y_PLUS',
  TBY = 'TBY',
  TB_MINUS = 'TB_MINUS',
  TB = 'TB',
  TB_PLUS = 'TB_PLUS',
  K = 'K',
}

// Court Direction enum
export enum CourtDirection {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

// Session types
export interface ISession {
  id: string;
  name: string;
  hostId: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  status: 'PREPARING' | 'IN_PROGRESS' | 'FINISHED';
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  courts?: Court[];
  players?: Player[];
  _count?: {
    players: number;
    courts: number;
  };
}

// Player types
export interface Player {
  id: string;
  sessionId: string;
  userId?: string;
  playerNumber: number;
  name?: string;
  gender?: 'MALE' | 'FEMALE';
  level?: Level;
  levelDescription?: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'READY' | 'INACTIVE';
  currentCourtId?: string;
  currentCourt?: Court;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
  requireConfirmInfo: boolean;
  phone?: string;
  desire?: string;
  position?: number;
  courtPosition?: number;
}

// Court types
export interface Court {
  id: string;
  sessionId: string;
  courtNumber: number;
  courtName?: string;
  direction: CourtDirection;
  status: 'EMPTY' | 'IN_USE' | 'READY';
  currentPlayers?: Player[];
  currentMatchId?: string;
  currentMatch?: Match;
  preSelectedPlayers?: Array<{
    playerId: string;
    position: number;
    player?: Player;
  }>;
}

// Match types
export interface Match {
  id: string;
  sessionId: string;
  courtId: string;
  status: 'IN_PROGRESS' | 'FINISHED';
  startTime: Date;
  endTime?: Date;
  players?: MatchPlayer[];
  durationMinutes?: number;
  court?: Court;
  isDraw: boolean;
  notes: string;
  score: {
    playerId: string;
    score: number;
  }[];
  winnerIds: string[];
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  player: Player;
  position: number;
}

// Player statistics response type
export interface PlayerStatistics {
  playerId: string;
  playerNumber: number;
  name?: string;
  gender?: string;
  level?: string;
  totalMatches: number;
  regularMatches: number;
  extraMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  totalPlayTime: number;
  totalWaitTime: number;
  status: string;
}

// Bulk Player types
export interface BulkPlayerData {
  playerNumber: number;
  name?: string;
  gender?: 'MALE' | 'FEMALE';
  level?: Level;
  levelDescription?: string;
  phone?: string;
  requireConfirmInfo?: boolean;
}

export interface BulkPlayersResponse {
  createdPlayers: Player[];
  session: ISession;
  message: string;
}

export interface BulkPlayersInfoResponse {
  sessionId: string;
  sessionName: string;
  maxPlayers: number;
  currentPlayersCount: number;
  availableSlots: number;
  availablePlayerNumbers: number[];
  existingPlayerNumbers: number[];
}

// Court creation interface
export interface CourtConfig {
  courtNumber: number;
  courtName?: string;
  direction?: CourtDirection;
}

// Session creation interface
export interface CreateSessionRequest {
  name: string;
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  startTime?: Date;
  endTime?: Date;
  courts?: CourtConfig[];
}

// Suggested players response types
export interface PlayerPair {
  players: Player[];
  totalLevelScore: number;
}

export interface SuggestedPlayersResponse {
  pair1: PlayerPair;
  pair2: PlayerPair;
  scoreDifference: number;
  totalPlayersConsidered: number;
}

// Join by code response types
export interface JoinByCodeResponse {
  player: {
    id: string;
    playerNumber: number;
    name: string;
    status: string;
    sessionId: string;
    requireConfirmInfo?: boolean;
    confirmedByPlayer?: boolean;
    joinCode?: string;
  };
  session: {
    id: string;
    name: string;
    status: string;
    numberOfCourts: number;
    maxPlayersPerCourt: number;
  };
  message: string;
}
