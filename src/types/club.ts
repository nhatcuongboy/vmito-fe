// Club-related types for the frontend

export enum EClubJoinPolicy {
  OPEN = 'OPEN',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  INVITATION_ONLY = 'INVITATION_ONLY',
}

export enum EMemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum EMemberStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum EJoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EClubStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IClubHost {
  id: string;
  name: string;
  image?: string;
  email?: string;
}

export interface IClubFeeConfig {
  id: string;
  clubId: string;
  month: number;
  year: number;
  maleFeeMonthly?: number;
  femaleFeeMonthly?: number;
  maleFeePerSession?: number;
  femaleFeePerSession?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: EMemberRole;
  status: EMemberStatus;
  attendanceCount: number;
  lastAttendedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    gender?: string;
    image?: string;
    phone?: string;
    level?: number;
  };
}

export interface IClubMonthlyMember {
  id: string;
  clubId: string;
  userId: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    gender?: string;
    image?: string;
    phone?: string;
    level?: number;
  };
}

export interface IClubSchedule {
  id: string;
  clubId: string;
  dayOfWeek: number; // 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
  startTime: string; // "19:00"
  endTime: string; // "21:00"
  notes?: string;
}

export interface IClubScheduleDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface IClubVenue {
  id: string;
  name: string;
  address: string;
  district?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface IClubAnnouncement {
  id: string;
  title: string;
  content: string;
  pinnedUntil?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface ICreateClubAnnouncementDto {
  title: string;
  content: string;
  pinnedUntil?: string;
}

export type IUpdateClubAnnouncementDto = Partial<ICreateClubAnnouncementDto>;

export interface IClub {
  id: string;
  slug?: string;
  hostId: string;
  name: string;
  hostName?: string; // Provisional host name for admin-created clubs
  description?: string;
  color?: string;
  image?: string;
  imagePublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  location?: string;
  isPublic: boolean;
  joinPolicy: EClubJoinPolicy;
  maxMembers?: number;
  sessionCount: number;
  totalPlayersServed: number;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  status: EClubStatus;
  rejectionReason?: string;
  currentMonthFee?: IClubFeeConfig;
  host: IClubHost;
  members?: IClubMember[];
  announcements?: IClubAnnouncement[];
  schedules?: IClubSchedule[];
  defaultVenue?: IClubVenue;
  scheduleVenues?: IClubVenue[];
  requiredLevels?: number[];
  viewCount?: number;
  isFavorite?: boolean;
}

export interface IClubListItem {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
  images?: string[];
  location?: string;
  joinPolicy: EClubJoinPolicy;
  maxMembers?: number;
  memberCount: number;
  sessionCount?: number;
  host: IClubHost;
  status: EClubStatus;
  rejectionReason?: string;
  createdAt: string;
  schedules?: IClubSchedule[];
  defaultVenue?: IClubVenue;
  distance?: number | null;
  requiredLevels?: number[];
  isFavorite?: boolean;
}

export interface IMyClub {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
  status?: EClubStatus;
  role: EMemberRole;
  memberCount: number;
  host: IClubHost;
  joinedAt: string;
  schedules?: IClubSchedule[];
  defaultVenue?: IClubVenue;
}

export interface IClubJoinRequest {
  id: string;
  clubId: string;
  userId: string;
  message?: string;
  status: EJoinRequestStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
  sessionsPlayedCount?: number;
  club?: {
    id: string;
    slug?: string;
    name: string;
    image?: string;
    host: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    gender?: string;
    level?: number;
    phone?: string;
    emailVerified?: string | null;
    createdAt?: string;
  };
}

export interface ICreateClubDto {
  name: string;
  hostName?: string; // Provisional host name for admin-created clubs
  hostUserId?: string; // Admin can assign a specific user as the initial ADMIN member
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
  defaultVenueId?: string;
  image?: string;
  imagePublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  schedules?: IClubScheduleDto[];
  requiredLevels?: number[];
}

export interface IUpdateClubDto {
  name?: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
  defaultVenueId?: string;
  image?: string;
  imagePublicId?: string;
  images?: string[];
  imagePublicIds?: string[];
  schedules?: IClubScheduleDto[];
  requiredLevels?: number[];
}

export interface ICreateClubFeeDto {
  month: number;
  year: number;
  maleFeeMonthly?: number;
  femaleFeeMonthly?: number;
  maleFeePerSession?: number;
  femaleFeePerSession?: number;
  notes?: string;
}

export interface IBrowseClubsParams {
  search?: string;
  location?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
  favoriteOnly?: boolean;
}

export interface IPaginatedClubList {
  items: IClubListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IJoinClubResponse {
  status: 'joined' | 'pending';
  message: string;
  requestId?: string;
}

export interface IClubUserSearchResult {
  id: string;
  name: string;
  email: string;
  gender?: string;
  image?: string;
  phone?: string;
  clubs: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}
