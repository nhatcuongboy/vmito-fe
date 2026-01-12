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
  requiredLevels?: Level[]; // Optional: empty array or undefined = all levels allowed
  courtColor?: string;
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
  userId?: string; // Optional userId to link with existing user
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
  requiredLevels?: Level[]; // Optional: empty array or undefined = all levels allowed
  startTime?: Date;
  endTime?: Date;
  courtColor?: string;
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
  usedAi?: boolean;
  aiReason?: string;
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

// ============================================
// Tournament Management Types
// ============================================

// Tournament enums
export enum TournamentStatus {
  PREPARING = 'PREPARING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum CategoryType {
  MENS_SINGLE = 'MENS_SINGLE',
  WOMENS_SINGLE = 'WOMENS_SINGLE',
  MENS_DOUBLE = 'MENS_DOUBLE',
  WOMENS_DOUBLE = 'WOMENS_DOUBLE',
  MIXED_DOUBLE = 'MIXED_DOUBLE',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum MatchFormat {
  BEST_OF_1 = 'BEST_OF_1', // 1 set only
  BEST_OF_3 = 'BEST_OF_3', // Best of 3 sets (first to win 2 sets)
}

// Tournament interfaces
export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  hostId: string;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  host?: {
    id: string;
    name: string;
    email: string;
  };
  categories?: Category[];
  umpires?: TournamentUmpire[];
  scoringDevices?: TournamentScoringDevice[];
  courts?: TournamentCourt[];
  _count?: {
    players: number;
    pairs: number;
    categories: number;
  };
}

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  type: CategoryType;
  hasGroupStage: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat: MatchFormat; // BEST_OF_1 or BEST_OF_3
  createdAt: Date;
  updatedAt: Date;
  registrations?: CategoryRegistration[];
  groups?: CategoryGroup[];
  matches?: CategoryMatch[];
  _count?: {
    registrations: number;
    matches: number;
    groups: number;
  };
}

export interface CategoryRegistration {
  id: string;
  categoryId: string;
  tournamentPlayerId?: string;
  tournamentPairId?: string;
  player?: TournamentPlayer;
  pair?: TournamentPair;
  createdAt: Date;
}

export interface CategoryGroup {
  id: string;
  categoryId: string;
  groupNumber: number;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  registrations?: CategoryGroupRegistration[];
  _count?: {
    registrations: number;
    matches: number;
  };
}

export interface CategoryGroupRegistration {
  id: string;
  groupId: string;
  categoryRegistrationId: string;
  createdAt: Date;
  categoryRegistration?: CategoryRegistration;
  group?: CategoryGroup;
}

export interface MatchSet {
  setNumber: number; // 1, 2, 3
  player1Score: number;
  player2Score: number;
  player3Score?: number; // For doubles
  player4Score?: number; // For doubles
}

export interface CategoryMatch {
  id: string;
  categoryId: string;
  groupId?: string;
  round: string;
  matchNumber: number;
  status: MatchStatus;
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  score?: string; // e.g., "21-19, 21-17" (for display)
  sets?: MatchSet[]; // Structured set scores
  winnerId?: string;
  isDraw: boolean;
  // Score breakdown for group stage calculations (total across all sets)
  player1Score?: number; // Sum of all sets
  player2Score?: number; // Sum of all sets
  player3Score?: number; // For doubles: sum of all sets
  player4Score?: number; // For doubles: sum of all sets
  matchFormat?: MatchFormat; // Match format for this specific match/round
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  participants?: CategoryMatchParticipant[];
  court?: TournamentCourt;
}

export interface CategoryMatchParticipant {
  id: string;
  matchId: string;
  categoryRegistrationId: string;
  position: number;
  categoryRegistration?: CategoryRegistration;
}

export interface TournamentUmpire {
  id: string;
  tournamentId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentScoringDevice {
  id: string;
  tournamentId: string;
  name: string;
  deviceType?: string;
  deviceId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentCourt {
  id: string;
  tournamentId: string;
  courtNumber: number;
  courtName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  level?: Level;
  levelDescription?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface TournamentPair {
  id: string;
  tournamentId: string;
  name?: string;
  type?: CategoryType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: TournamentPairMember[];
}

export interface TournamentPairMember {
  id: string;
  pairId: string;
  playerId: string;
  position: number;
  player?: TournamentPlayer;
}

// Request types
export interface CreateTournamentRequest {
  name: string;
  startDate: Date;
  endDate: Date;
  categories: Array<{
    name: string;
    type: CategoryType;
  }>;
  umpires?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  scoringDevices?: Array<{
    name: string;
    deviceType?: string;
  }>;
  courts?: Array<{
    courtNumber: number;
    courtName?: string;
  }>;
}

export interface UpdateCategoryRequest {
  hasGroupStage?: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat?: MatchFormat; // BEST_OF_1 or BEST_OF_3
}

export interface CreateCategoryRegistrationRequest {
  tournamentPlayerId?: string;
  tournamentPairId?: string;
}

export interface CreateCategoryMatchRequest {
  groupId?: string;
  round: string;
  matchNumber: number;
  participants: Array<{
    categoryRegistrationId: string;
    position: number;
  }>;
  courtId?: string;
  startTime?: Date;
  matchFormat?: MatchFormat; // Match format for this specific match/round
}

export interface EndCategoryMatchRequest {
  score: string; // e.g., "21-19, 21-17" (for display)
  sets?: MatchSet[]; // Structured set scores
  winnerId?: string;
  isDraw?: boolean;
  // Score breakdown for group stage calculations (total across all sets)
  // If sets array is provided, these will be calculated automatically
  player1Score?: number; // Total points (sum of all sets)
  player2Score?: number; // Total points (sum of all sets)
  player3Score?: number; // For doubles: total points (sum of all sets)
  player4Score?: number; // For doubles: total points (sum of all sets)
  notes?: string;
}

// Group Standings types
export interface GroupStanding {
  categoryRegistrationId: string;
  registration: CategoryRegistration & {
    player?: TournamentPlayer;
    pair?: TournamentPair;
  };
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  points: number; // Win = 2, Draw = 1, Loss = 0 (hoặc custom)
  pointsFor: number; // Tổng điểm ghi được
  pointsAgainst: number; // Tổng điểm bị thua
  pointDifference: number; // pointsFor - pointsAgainst
  rank: number; // Thứ hạng trong group
}

export interface GroupStandingsResponse {
  group: CategoryGroup;
  standings: GroupStanding[];
}

export type CategoryStandingsResponse = Array<{
  group: CategoryGroup;
  standings: GroupStanding[];
}>;
