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
  REFEREE = 'REFEREE',
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
  CANCELLED = 'CANCELLED',
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

export interface LevelDescription {
  level: number;
  description: string;
  updatedAt?: string;
}

// ============================================
// Fee and Payment Management Types
// ============================================

// Fee type enum - Fixed or Split evenly
export enum FeeType {
  FIXED = 'FIXED', // Giá vãng lai theo giới tính
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

export interface ISessionExpense {
  id: string;
  sessionId: string;
  name: string;
  amount: number; // VND
  createdAt: Date;
  updatedAt: Date;
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

// Detailed payment statistics
export interface PaymentStats {
  total: number;
  totalAmount: number;
  paidAmount: number;
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
}

// Response for getSessionPayments
export interface SessionPaymentsResponse {
  payments: PaymentRecord[];
  stats: PaymentStats;
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
  qrCodeUrl?: string | null;
  isDefault?: boolean;
}

export interface UpdateHostPaymentSettingsRequest {
  bankName?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  qrCodeUrl?: string | null;
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
  amount?: number;
  paymentMethod?: PaymentMethod;
}

export interface RejectPaymentRequest {
  hostNotes: string; // Required - reason for rejection
}

export enum VenueStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ClosureStatus {
  OPERATING = 'OPERATING',
  PERMANENTLY_CLOSED = 'PERMANENTLY_CLOSED',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
}

export interface Venue {
  id: string;
  slug?: string;
  placeId?: string;
  name: string;
  acronym?: string;
  description?: string;
  address: string;
  lat?: number;
  lng?: number;
  district?: string;
  city?: string;
  newAddress?: string;
  newDistrict?: string;
  newCity?: string;
  isVerified?: boolean;
  openingHours?: string;
  numberOfCourts?: number;
  status?: VenueStatus;
  phone?: string;
  website?: string;
  hourlyRateFixed?: number;
  hourlyRateWalkIn?: number;
  hasCarParking?: boolean;
  hasCanteen?: boolean;
  wifiName?: string;
  wifiPassword?: string;
  closureStatus?: ClosureStatus;
  bookingPolicy?: string;
  locatedWithin?: string;
  createdAt?: Date;
  updatedAt?: Date;
  distance?: number;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  courtLayoutImage?: string;
  courtLayoutImagePublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  viewCount?: number;
}

export enum VenueRequestType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export enum VenueRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface VenueRequestPayload {
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  numberOfCourts?: number;
  openingHours?: string;
  hourlyRateFixed?: number;
  hourlyRateWalkIn?: number;
  phone?: string;
  website?: string;
  locatedWithin?: string;
  bookingPolicy?: string;
  note?: string;
}

export interface VenueRequest {
  id: string;
  type: VenueRequestType;
  status: VenueRequestStatus;
  submittedByUserId: string;
  venueId?: string | null;
  appliedVenueId?: string | null;
  payload: VenueRequestPayload;
  adminNote?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  venue?: Venue | null;
  appliedVenue?: Venue | null;
}

export interface SearchVenueResponse {
  data: Venue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Session types
export interface ISession {
  id: string;
  slug?: string;
  name: string;
  notes?: string;
  hostId: string;
  host: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
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
  allowZaloContact?: boolean;
  courtColor?: string;
  defaultMatchType?: 'SINGLES' | 'DOUBLES';
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  shuttlecock?: string;
  referenceVideoUrl?: string | null;
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
  // Scheduling fields
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  gracePeriodEnd?: Date;
  cancelledAt?: Date;
  _count?: {
    players: number;
    courts: number;
  };
  viewCount?: number;
}

// Player types
export interface Player {
  id: string;
  sessionId: string;
  userId?: string;
  createdByUserId?: string; // User who registered this player (for multi-slot grouping)
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
  // Club fields
  isClubMember?: boolean;
  clubId?: string;
  clubFeeApplied?: boolean;
  club?: {
    id: string;
    name: string;
    color?: string;
  };
}

export interface PendingRequest extends Player {
  session: {
    id: string;
    name: string;
    startTime: string;
    venue?: { name: string } | null;
  };
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
  isExtra?: boolean;
  score: {
    playerId: string;
    score: number;
  }[];
  winnerIds: string[];
  shuttlecockCount?: number;
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
  totalShuttlecocks?: number | null;
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
  id?: string;
  courtNumber: number;
  courtName?: string;
  direction?: CourtDirection;
}

// Session creation interface
export interface CreateSessionRequest {
  name: string;
  notes?: string;
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
  allowZaloContact?: boolean;
  startTime?: Date;
  endTime?: Date;
  courtColor?: string;
  shuttlecock?: string;
  defaultMatchType?: 'SINGLES' | 'DOUBLES';
  courts?: CourtConfig[];
  venue?: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>; // Inline venue object (backend doesn't support venueId)
  feeConfig?: CreateSessionFeeConfigRequest; // Fee configuration
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  referenceVideoUrl?: string | null;
}

// Bulk session creation types
export type BulkCreationMode =
  | 'single'
  | 'specific-dates'
  | 'recurring-weekdays';

export interface SpecificDatesConfig {
  dates: Date[]; // Array of specific dates to clone the session to
}

export interface RecurringWeekdaysConfig {
  weekdays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  numberOfWeeks: number; // Number of weeks to repeat
  startDate?: Date; // Optional start date, defaults to session startTime
}

export interface BulkSessionCreationRequest {
  mode: BulkCreationMode;
  baseSession: CreateSessionRequest;
  specificDates?: SpecificDatesConfig;
  recurringWeekdays?: RecurringWeekdaysConfig;
}

export interface BulkSessionCreationResponse {
  success: boolean;
  sessionsCreated: number;
  sessions: ISession[];
  errors?: Array<{
    date: string;
    error: string;
  }>;
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

export enum SportType {
  BADMINTON = 'BADMINTON',
  PICKLEBALL = 'PICKLEBALL',
}

export enum CategoryType {
  MENS_SINGLE = 'MENS_SINGLE',
  WOMENS_SINGLE = 'WOMENS_SINGLE',
  MENS_DOUBLE = 'MENS_DOUBLE',
  WOMENS_DOUBLE = 'WOMENS_DOUBLE',
  MIXED_DOUBLE = 'MIXED_DOUBLE',
  CUSTOM = 'CUSTOM',
}

export enum CategoryRegistrationMode {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
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
  BEST_OF_5 = 'BEST_OF_5', // Best of 5 sets (first to win 3 sets)
}

export enum ScheduleType {
  NEXT_AVAILABLE = 'NEXT_AVAILABLE',
  ASSIGNED = 'ASSIGNED',
}

// Tournament interfaces
export interface Tournament {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  hostId: string;
  status: TournamentStatus;
  sportType?: SportType;
  isPublished: boolean;
  scheduleType?: ScheduleType;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  youtubeVideoUrls?: string[];
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
  host?: {
    id: string;
    name: string;
    email: string;
  };
  venue?: Venue;
  venueId?: string | null;
  categories?: Category[];
  umpires?: TournamentUmpire[];
  scoringDevices?: TournamentScoringDevice[];
  courts?: TournamentCourt[];
  sponsors?: Sponsor[];
  _count?: {
    players: number;
    pairs: number;
    categories: number;
  };
}

export interface Sponsor {
  id: string;
  tournamentId: string;
  name: string;
  logo?: string | null;
  logoPublicId?: string | null;
  website?: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSponsorRequest {
  name: string;
  logo?: string;
  logoPublicId?: string;
  website?: string;
  displayOrder?: number;
}

export type UpdateSponsorRequest = Partial<CreateSponsorRequest>;

export enum CategoryFormat {
  ROUND_ROBIN = 'ROUND_ROBIN',
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  ROUND_ROBIN_TO_SE = 'ROUND_ROBIN_TO_SE',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
}

export interface Category {
  id: string;
  tournamentId: string;
  name: string;
  type: CategoryType;
  registrationMode: CategoryRegistrationMode;
  teamSize: number;
  format: CategoryFormat;
  hasGroupStage: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat: MatchFormat; // BEST_OF_1 or BEST_OF_3
  eliminationMatchFormat?: MatchFormat;
  thirdPlaceMatch?: boolean;
  // ── Per-set scoring rules (BWF defaults: 21 / win-by-2 / cap 30) ──
  pointsToWin?: number;
  winByTwo?: boolean;
  /** Null/undefined = no hard cap. */
  pointCap?: number | null;
  // ── Per-stage scoring overrides (null/undefined = inherit) ──
  knockoutPointsToWin?: number | null;
  knockoutWinByTwo?: boolean | null;
  knockoutPointCap?: number | null;
  finalPointsToWin?: number | null;
  finalWinByTwo?: boolean | null;
  finalPointCap?: number | null;
  formatConfig?: Record<string, unknown>;
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

export interface CategoryGroupStageCompletion {
  categoryId: string;
  categoryName: string;
  isEligible: boolean;
  isCompleted: boolean;
  canGenerateBracket: boolean;
  hasBracket: boolean;
  totalGroupMatches: number;
  finishedGroupMatches: number;
  unfinishedGroupMatches: number;
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
  matchCode?: string;
  status: MatchStatus;
  startTime?: Date;
  endTime?: Date; // Actual end time — set when match finishes
  estimatedEndTime?: Date; // Scheduled end time — set when match is scheduled
  courtId?: string;
  score?: string; // e.g., "21-19, 21-17" (for display)
  sets?: MatchSet[]; // Structured set scores
  winnerId?: string;
  isDraw: boolean;
  isForfeit?: boolean; // Decided by forfeit/walkover: winnerId wins, the other forfeited
  refereeName?: string | null; // Name entered by the referee when ending the match
  // Score breakdown for group stage calculations (total across all sets)
  player1Score?: number; // Sum of all sets
  player2Score?: number; // Sum of all sets
  player3Score?: number; // For doubles: sum of all sets
  player4Score?: number; // For doubles: sum of all sets
  player1Points?: number; // Manual standings points for side 1 (pointsEarning = 'manual')
  player2Points?: number; // Manual standings points for side 2 (pointsEarning = 'manual')
  servingSide?: 1 | 2 | null; // Pickleball doubles: side currently serving
  serverNumber?: 1 | 2 | null; // Pickleball doubles: first or second server
  matchFormat?: MatchFormat; // Match format for this specific match/round
  // Per-match scoring-rule overrides. Null = inherit from category.
  pointsToWin?: number | null;
  winByTwo?: boolean | null;
  pointCap?: number | null;
  notes?: string | null;
  refereeId?: string; // Assigned referee (TournamentUmpire id)
  referee?: TournamentUmpire | null;
  // Double-elimination bracket linkage. bracketType: 'UPPER' | 'LOWER' | 'GF'.
  bracketType?: string | null;
  winnerNextMatchId?: string | null;
  winnerNextSlot?: number | null;
  loserNextMatchId?: string | null;
  loserNextSlot?: number | null;
  createdAt: Date;
  updatedAt: Date;
  participants?: CategoryMatchParticipant[];
  court?: TournamentCourt;
  /** Populated by getMatchById — used to resolve inherited scoring rules / format. */
  category?: Category;
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
  userId?: string; // Linked user account (login-able referee)
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
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
  tournamentVenueId?: string;
  courtNumber: number;
  courtName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentVenue {
  id: string;
  tournamentId: string;
  venueId: string;
  venue: Venue;
  courts?: TournamentCourt[];
  createdAt: Date;
}

export interface TournamentPlayer {
  id: string;
  tournamentId: string;
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  imagePublicId?: string;
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    image?: string;
  };
  /** Usage counts: how many category registrations and pair memberships reference this player */
  _count?: {
    registrations: number;
    pairMembers: number;
  };
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
  venueId?: string;
  sportType?: SportType;
}

export interface DuplicateTournamentRequest {
  name: string;
  startDate: string;
  endDate: string;
  venueId?: string | null;
  copy: {
    format: true;
    schedule: boolean;
    teams: boolean;
    venues: boolean;
    matchResults: boolean;
    customHomePage: boolean;
  };
}

export type DuplicateTournamentResponse = Tournament;

export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  registrationMode?: CategoryRegistrationMode;
  teamSize?: number;
  format?: CategoryFormat;
  hasGroupStage?: boolean;
  averageMatchDuration?: number;
  groupCount?: number;
  winnersPerGroup?: number;
  playersPerGroup?: number;
  matchFormat?: MatchFormat;
  eliminationMatchFormat?: MatchFormat;
  thirdPlaceMatch?: boolean;
  // Per-set scoring rules
  pointsToWin?: number;
  winByTwo?: boolean;
  pointCap?: number | null;
  // Per-stage scoring overrides (null = inherit)
  knockoutPointsToWin?: number | null;
  knockoutWinByTwo?: boolean | null;
  knockoutPointCap?: number | null;
  finalPointsToWin?: number | null;
  finalWinByTwo?: boolean | null;
  finalPointCap?: number | null;
  formatConfig?: Record<string, unknown>;
}

export interface CreateCategoryRegistrationRequest {
  tournamentPlayerId?: string;
  tournamentPairId?: string;
}

export interface CreateCategoryMatchRequest {
  groupId?: string;
  round: string;
  matchNumber: number;
  matchCode?: string;
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
  isForfeit?: boolean; // Decided by forfeit/walkover: winnerId wins, the other forfeited
  // Score breakdown for group stage calculations (total across all sets)
  // If sets array is provided, these will be calculated automatically
  player1Score?: number; // Total points (sum of all sets)
  player2Score?: number; // Total points (sum of all sets)
  player3Score?: number; // For doubles: total points (sum of all sets)
  player4Score?: number; // For doubles: total points (sum of all sets)
  player1Points?: number; // Manual standings points for side 1 (pointsEarning = 'manual')
  player2Points?: number; // Manual standings points for side 2 (pointsEarning = 'manual')
  notes?: string | null;
  refereeName?: string | null;
}

// ─── Live scoring / scoreboard types ───

export interface LiveScoreUpdateRequest {
  side: 1 | 2; // 1 = position 1, 2 = position 2
  delta: 1 | -1; // +1 to add a point, -1 to correct
  clientId?: string; // origin tag for echo-suppression
  seq?: number; // monotonic per clientId
}

export interface PickleballServeUpdateRequest {
  servingSide: 1 | 2;
  serverNumber: 1 | 2;
  clientId?: string;
  seq?: number;
}

export interface UpdateSetScoreRequest {
  player1Score: number;
  player2Score: number;
  clientId?: string;
  seq?: number;
}

export interface AssignRefereeRequest {
  refereeId: string; // TournamentUmpire id
}

export interface LinkUmpireAccountRequest {
  email: string;
}

export interface GetScoreboardParams {
  status?: MatchStatus;
  courts?: string[]; // TournamentCourt ids
  includeFinished?: boolean;
}

export interface ScoreboardSide {
  registrationId: string | null;
  name: string;
  players: string[];
}

// Normalized match payload returned by GET /tournaments/:id/scoreboard and
// broadcast over the /tournaments socket (the `match` field of each event).
export interface ScoreboardMatch {
  matchId: string;
  tournamentId: string | null;
  categoryId: string;
  categoryName: string | null;
  sportType?: SportType | null;
  teamSize?: number | null;
  isDoubles?: boolean | null;
  round: string;
  matchNumber: number;
  status: MatchStatus;
  court: { id: string; courtNumber: number; courtName: string | null } | null;
  matchFormat: MatchFormat | null;
  refereeName: string | null;
  side1: ScoreboardSide;
  side2: ScoreboardSide;
  sets: MatchSet[];
  score: string | null;
  currentSet: { setNumber: number; side1: number; side2: number } | null;
  setWins: { side1: number; side2: number };
  servingSide?: 1 | 2 | null;
  serverNumber?: 1 | 2 | null;
  winnerId: string | null;
  isDraw: boolean;
  isComplete: boolean; // rules say the match is won (referee must confirm End)
  pendingWinnerId: string | null;
  startTime: string | null;
  endTime: string | null;
  estimatedEndTime: string | null;
  updatedAt: string;
}

export interface ScoreboardResponse {
  tournament: { id: string; name: string; slug: string };
  matches: ScoreboardMatch[];
  courts: Array<{
    court: { id: string; courtNumber: number; courtName: string | null };
    matches: ScoreboardMatch[];
  }>;
  ungrouped: ScoreboardMatch[];
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
  matchesForfeited: number; // Số trận bị xử thua do bỏ cuộc
  matchesCancelled: number; // Số trận bị huỷ
  points: number; // Win = 2, Draw = 1, Loss = 0 (hoặc custom)
  pointsFor: number; // Tổng điểm ghi được
  pointsAgainst: number; // Tổng điểm bị thua
  pointDifference: number; // pointsFor - pointsAgainst
  gamesWon: number; // Tổng số set thắng
  gamesLost: number; // Tổng số set thua
  gameDifference: number; // gamesWon - gamesLost
  recentForm?: Array<'W' | 'L' | 'D'>; // Kết quả 5 trận gần nhất (cũ → mới)
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

// ─── Tournament managers ───
export type TournamentPermission =
  | 'RESULTS'
  | 'SCHEDULE'
  | 'PARTICIPANTS'
  | 'STRUCTURE';

export const TOURNAMENT_PERMISSIONS: TournamentPermission[] = [
  'RESULTS',
  'SCHEDULE',
  'PARTICIPANTS',
  'STRUCTURE',
];

export interface TournamentManager {
  id: string;
  tournamentId: string;
  userId: string;
  permissions: TournamentPermission[];
  addedById?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; image?: string };
}

// Current user's management access to a tournament (gates the manage UI).
export interface TournamentMyAccess {
  tournamentId: string;
  isHost: boolean;
  isAdmin: boolean;
  permissions: TournamentPermission[];
}

export interface AddTournamentManagerRequest {
  userId: string;
  permissions: TournamentPermission[];
}

export interface UpdateTournamentManagerRequest {
  permissions: TournamentPermission[];
}

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

// ============================================
// Notification System Types
// ============================================

export enum NotificationType {
  SYSTEM = 'SYSTEM', // Admin broadcast notifications
  SESSION = 'SESSION', // Session-related notifications
  REGISTRATION = 'REGISTRATION', // Registration status updates
  PAYMENT = 'PAYMENT', // Payment-related notifications
  CLUB = 'CLUB', // Club-related notifications
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface IAdminNotificationUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IAdminNotification extends INotification {
  user: IAdminNotificationUser;
}

export interface IPaginatedNotifications {
  data: INotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IPaginatedAdminNotifications {
  data: IAdminNotification[];
  pagination: IPaginatedNotifications['pagination'];
}

export interface IBroadcastNotificationRequest {
  title: string;
  message: string;
}

// Socket Events
export interface ISessionConflictData {
  message: string;
  timestamp: string;
}

// Schedule types
export interface IBulkScheduleItem {
  matchId: string;
  courtId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

// Schedule Generator types
export interface ICourtConstraint {
  categories?: string[];
  rounds?: string[];
  groups?: string[];
}

export interface ICourtTimeSlotConfig {
  courtId: string;
  constraints?: ICourtConstraint;
}

export interface ITimeSlotConfig {
  date: string;
  startTime: string;
  endTime: string;
  timeBuffer: number;
  courts: ICourtTimeSlotConfig[];
}

export interface IMatchDurations {
  POOL_PLAY: number;
  PLAYOFFS: number;
}

export interface IGenerateScheduleRequest {
  categoryPriorities: string[];
  matchDurations: IMatchDurations;
  timeSlots: ITimeSlotConfig[];
  keepScheduledMatches: boolean;
}

export interface IScheduleConflict {
  matchId: string;
  reason: string;
  type: 'COURT_OVERLAP' | 'PARTICIPANT_OVERLAP' | 'NO_AVAILABLE_SLOT';
}

export interface IScheduleCategorySummary {
  categoryId: string;
  categoryName: string;
  scheduled: number;
  total: number;
  byRound: {
    round: string;
    scheduled: number;
    total: number;
    byGroup?: {
      groupId: string;
      groupName: string;
      scheduled: number;
      total: number;
    }[];
  }[];
}

export interface IGenerateScheduleResponse {
  scheduleId: string;
  summary: {
    totalMatches: number;
    scheduledMatches: number;
    unscheduledMatches: number;
    byCategory: IScheduleCategorySummary[];
  };
  conflicts: IScheduleConflict[];
}

export interface IPreviewMatch {
  matchId: string;
  matchNumber: number;
  categoryId: string;
  categoryName: string;
  round: string;
  participants: string[];
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  duration: number;
}

export interface ISchedulePreviewResponse {
  scheduleId: string;
  matches: IPreviewMatch[];
}

export interface IUpdateMatchAssignment {
  courtId: string;
  startTime: string;
  duration: number;
}

export interface ISaveScheduleResponse {
  success: boolean;
  scheduledCount: number;
  unscheduledCount: number;
}

export interface IValidateScheduleResponse {
  valid: boolean;
  errors: { field: string; message: string }[];
}

// ===== Next Available Court mode (live queue) =====
export enum TournamentCourtStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ICourtCurrentMatch {
  matchId: string;
  categoryId: string;
  round: string;
  matchNumber: number;
  status: string;
  participants: IQueuedMatchParticipant[];
}

export interface ICourtAvailability {
  courtId: string;
  courtNumber: number;
  courtName?: string;
  status: TournamentCourtStatus;
  currentMatchId?: string;
  currentMatch?: ICourtCurrentMatch;
  estimatedAvailableAt?: string;
}

export interface IQueuedMatchParticipant {
  id: string;
  name: string;
}

export interface IQueuedMatch {
  matchId: string;
  categoryId: string;
  round: string;
  matchNumber: number;
  queueOrder: number;
  estimatedDuration?: number;
  participants: IQueuedMatchParticipant[];
}

export interface IAutoAssignResult {
  success: boolean;
  matchId: string;
  courtId?: string;
  assignedAt?: string;
  error?: string;
}

export interface IInitializeQueueResponse {
  queuedCount: number;
}

// Image category enum
export enum EImageCategory {
  SESSION_COVER = 'SESSION_COVER',
  AVATAR = 'AVATAR',
  CLUB = 'CLUB',
  VENUE_COVER = 'VENUE_COVER',
  QR_CODE = 'QR_CODE',
  PAYMENT_PROOF = 'PAYMENT_PROOF',
  OTHER = 'OTHER',
}

// User image types
export interface IUserImage {
  id: string;
  userId: string;
  url: string;
  publicId: string;
  originalName?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  category: EImageCategory;
  createdAt: string;
  updatedAt: string;
}

export interface IUserImageListResponse {
  data: IUserImage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
