export interface IFixedMemberGroup {
  id: string;
  hostId: string;
  name: string;
  description?: string;
  color?: string;
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
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    gender?: string;
    image?: string;
    phone?: string;
  };
}

export interface ICreateGroupDto {
  name: string;
  description?: string;
  color?: string;
}

export interface IUpdateGroupDto {
  name?: string;
  description?: string;
  color?: string;
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
