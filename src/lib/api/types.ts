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
  ADMIN = 'ADMIN',
}

// Court Direction enum
export enum CourtDirection {
  HORIZONTAL = 'HORIZONTAL',
  VERTICAL = 'VERTICAL',
}

// Gender enum - synced with Backend (Prisma schema)
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

// Enums synced with Backend
export enum SessionStatus {
  PREPARING = 'PREPARING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum CourtStatus {
  EMPTY = 'EMPTY',
  IN_USE = 'IN_USE',
  READY = 'READY',
}

export enum PlayerStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  READY = 'READY',
  INACTIVE = 'INACTIVE',
}

export enum PlayerLevel {
  BEGINNER = 1,
  ADVANCED_BEGINNER = 2,
  LOW_INTERMEDIATE = 3,
  INTERMEDIATE = 4,
  HIGH_INTERMEDIATE = 5,
  ADVANCED = 6,
  SEMI_PRO = 7,
  PRO = 8,
}

// ============================================
// Fee and Payment Management Types
// ============================================

// Fee type enum - Fixed or Split evenly
export enum FeeType {
  FIXED = 'FIXED', // Giá cố định theo giới tính
  SPLIT_EVENLY = 'SPLIT_EVENLY', // Chia đều sau session
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING', // Chưa thanh toán
  SUBMITTED = 'SUBMITTED', // Đã đánh dấu, chờ duyệt
  APPROVED = 'APPROVED', // Host đã duyệt
  REJECTED = 'REJECTED', // Host từ chối
}

// Session fee configuration
export interface SessionFeeConfig {
  id: string;
  sessionId: string;
  feeType: FeeType;
  maleFee?: number; // VND - null nếu SPLIT_EVENLY
  femaleFee?: number; // VND - null nếu SPLIT_EVENLY
  splitTotal?: number; // Tổng tiền để chia (chỉ cho SPLIT_EVENLY)
  splitPerPlayer?: number; // = splitTotal / số người chơi (calculated)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Host payment settings
export interface HostPaymentSettings {
  id: string;
  userId: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  qrCodeUrl?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payment record (per player per session)
export interface PaymentRecord {
  id: string;
  sessionId: string;
  playerId: string;
  registeredByUserId?: string; // User đăng ký (cho multi-slot)
  hostId: string;
  amount: number; // VND
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  proofImageUrl?: string;
  proofNotes?: string;
  hostNotes?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  player?: Player;
  session?: ISession;
}

// Transaction summary (player xem theo host)
export interface TransactionSummary {
  hostId: string;
  hostName: string;
  hostImage?: string;
  totalSessions: number;
  totalAmount: number; // VND
  paidAmount: number; // VND
  pendingAmount: number; // VND
  averageRating?: number; // Host's average rating
  totalRatings?: number; // Host's total ratings count
}

// Host transaction summary (host xem theo player)
export interface HostTransactionSummary {
  userId: string;
  userName: string;
  userImage?: string;
  totalSessions: number;
  totalAmount: number; // VND
  paidAmount: number; // VND
  pendingAmount: number; // VND
  averageRating?: number; // Player's average rating
  totalRatings?: number; // Player's total ratings count
}

// Request types for fee configuration
export interface CreateSessionFeeConfigRequest {
  feeType: FeeType;
  maleFee?: number;
  femaleFee?: number;
  notes?: string;
}

export interface UpdateSessionFeeConfigRequest {
  feeType?: FeeType;
  maleFee?: number;
  femaleFee?: number;
  splitTotal?: number; // Only for SPLIT_EVENLY after session ends
  notes?: string;
}

// Request types for payment settings
export interface CreateHostPaymentSettingsRequest {
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  qrCodeUrl?: string;
  isDefault?: boolean;
}

export interface UpdateHostPaymentSettingsRequest {
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  qrCodeUrl?: string;
  isDefault?: boolean;
}

// Request types for payment actions
export interface SubmitPaymentRequest {
  paymentMethod: PaymentMethod;
  proofImageUrl?: string; // Required for BANK_TRANSFER
  proofNotes?: string;
}

export interface ApprovePaymentRequest {
  hostNotes?: string;
}

export interface RejectPaymentRequest {
  hostNotes: string; // Required - reason for rejection
}

export interface Venue {
  id: string;
  placeId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  district?: string;
  city?: string;
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
  hostName?: string;
  hostPhone?: string;
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  requiredLevels?: number[]; // Optional: empty array or undefined = all levels allowed
  allowGuestJoin?: boolean;
  allowNewPlayers?: boolean;
  courtColor?: string;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  status: SessionStatus;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  venue?: Venue;
  description?: string;
  courts?: Court[];
  players?: Player[];
  pendingPlayers?: Player[];
  feeConfig?: SessionFeeConfig; // Fee configuration for the session
  distance?: number; // Distance from user location in kilometers (calculated when sorted by distance)
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
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  status: PlayerStatus;
  registrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentCourtId?: string;
  currentCourt?: Court;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
  requireConfirmInfo: boolean;
  phone?: string;
  desire?: string;
  position?: number;
  courtPosition?: number;
  joinCode?: string;
  user?: {
    image?: string | null;
    name?: string;
    email?: string;
  };
  paymentRecord?: PaymentRecord; // Payment record for this player
}

// Court types
export interface Court {
  id: string;
  sessionId: string;
  courtNumber: number;
  courtName?: string;
  direction: CourtDirection;
  status: CourtStatus;
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
  match?: Match;
}

// Player statistics response type
export interface PlayerStatistics {
  playerId: string;
  playerNumber: number;
  name?: string;
  gender?: GenderType;
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
  status: PlayerStatus;
}

// Bulk Player types
export interface BulkPlayerData {
  playerNumber?: number;
  name?: string;
  gender?: GenderType;
  level?: number;
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
  description?: string;
  hostName?: string;
  hostPhone?: string;
  numberOfCourts: number;
  sessionDuration: number;
  maxPlayersPerCourt: number;
  requirePlayerInfo: boolean;
  requiredLevels?: number[]; // Optional: empty array or undefined = all levels allowed
  allowGuestJoin?: boolean;
  allowNewPlayers?: boolean;
  startTime?: Date;
  endTime?: Date;
  courtColor?: string;
  courts?: CourtConfig[];
  venue?: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>; // Inline venue object (backend doesn't support venueId)
  feeConfig?: CreateSessionFeeConfigRequest; // Fee configuration
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
  gender?: GenderType;
  level?: number;
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

// ============================================
// Rating & Review System Types
// ============================================

export enum RatingType {
  PLAYER_TO_HOST = 'PLAYER_TO_HOST',
  HOST_TO_PLAYER = 'HOST_TO_PLAYER',
}

export interface Rating {
  id: string;
  sessionId: string;
  raterUserId: string; // User giving rating
  ratedUserId: string; // User receiving rating
  type: RatingType; // Direction (player→host or host→player)
  rating: number; // 1-5 stars
  comment?: string; // Optional review (max 500 chars)
  createdAt: Date;
  updatedAt: Date;
  rater?: { id: string; name: string; image?: string };
  rated?: { id: string; name: string; image?: string };
  session?: { id: string; name: string };
}

export interface UserRatingStats {
  userId: string;
  averageRating: number; // Overall average
  totalRatings: number; // Total count
  asHostAverage?: number; // Average when acting as host
  asHostCount?: number;
  asPlayerAverage?: number; // Average when acting as player
  asPlayerCount?: number;
}

export interface SessionRatingEligibility {
  canRateHost: boolean;
  hasRatedHost: boolean;
  hostRating?: Rating;
  canRatePlayers: string[]; // Player IDs host can rate
  ratedPlayerIds: string[]; // Player IDs already rated by host
  playerRatings: Rating[];
}

export interface CreateRatingRequest {
  sessionId: string;
  ratedUserId: string;
  type: RatingType;
  rating: number; // 1-5 required
  comment?: string; // Max 500 chars
}

export interface GetRatingsRequest {
  userId?: string;
  sessionId?: string;
  type?: RatingType;
  raterUserId?: string;
  ratedUserId?: string;
}
