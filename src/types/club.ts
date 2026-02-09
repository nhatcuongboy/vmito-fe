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

export interface IClubHost {
  id: string;
  name: string;
  image?: string;
  email?: string;
}

export interface IClubMember {
  id: string;
  role: EMemberRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    gender?: string;
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
  name: string;
  description?: string;
  color?: string;
  image?: string;
  location?: string;
  isPublic?: boolean;
  joinPolicy: EClubJoinPolicy;
  maxMembers?: number;
  memberCount: number;
  sessionCount?: number;
  totalPlayersServed?: number;
  host: IClubHost;
  members?: IClubMember[];
  announcements?: IClubAnnouncement[];
  createdAt: string;
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
  status: EJoinRequestStatus;
  message?: string;
  response?: string;
  club: {
    id: string;
    name: string;
    image?: string;
    host: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
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
