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
}

export interface IUpdateClubDto {
  name?: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
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
