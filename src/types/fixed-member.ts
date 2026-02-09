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

export enum EClubJoinPolicy {
  OPEN = 'OPEN',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  INVITATION_ONLY = 'INVITATION_ONLY',
}

export enum EJoinRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IFixedMemberGroup {
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
  memberCount?: number;
  currentMonthFee?: IFixedMemberGroupFeeConfig;
}

export interface IFixedMemberGroupFeeConfig {
  id: string;
  groupId: string;
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

export interface IFixedMemberGroupMember {
  id: string;
  groupId: string;
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

export interface IClubJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: EJoinRequestStatus;
  response?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    gender?: string;
    level?: number;
  };
}

export interface ICreateGroupDto {
  name: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
}

export interface IUpdateGroupDto {
  name?: string;
  description?: string;
  color?: string;
  isPublic?: boolean;
  joinPolicy?: EClubJoinPolicy;
  maxMembers?: number;
  location?: string;
}

export interface ICreateGroupFeeDto {
  month: number;
  year: number;
  maleFeeMonthly?: number;
  femaleFeeMonthly?: number;
  maleFeePerSession?: number;
  femaleFeePerSession?: number;
  notes?: string;
}

export interface IUserSearchResult {
  id: string;
  name: string;
  email: string;
  gender?: string;
  image?: string;
  phone?: string;
  groups: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}
