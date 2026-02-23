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

export interface IClub {
  id: string;
  hostId: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
  imagePublicId?: string;
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
}

export interface IClubListItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
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
}

export interface IMyClub {
  id: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
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
  club?: {
    id: string;
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
  };
}

export interface ICreateClubDto {
  name: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
  defaultVenueId?: string;
  image?: string;
  imagePublicId?: string;
  schedules?: IClubScheduleDto[];
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
  schedules?: IClubScheduleDto[];
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
