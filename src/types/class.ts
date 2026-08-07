import { SportType } from '@/lib/api/types';

export type ClassStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
export type ClassTuitionPeriod =
  | 'PER_SESSION'
  | 'MONTHLY'
  | 'COURSE'
  | 'CONTACT';

export interface IClassSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface IClassVenue {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface IClass {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  contactName: string;
  contactPhone: string;
  zaloUrl?: string | null;
  sportType: SportType;
  requiredLevels: number[];
  startDate?: string | null;
  endDate?: string | null;
  capacity?: number | null;
  tuitionPeriod: ClassTuitionPeriod;
  tuitionAmount?: number | null;
  tuitionNotes?: string | null;
  venueId?: string | null;
  venue?: IClassVenue | null;
  customLocationName?: string | null;
  customLocationAddress?: string | null;
  customLocationDistrict?: string | null;
  customLocationCity?: string | null;
  customLocationLat?: number | null;
  customLocationLng?: number | null;
  coverPhoto?: string | null;
  images: string[];
  status: ClassStatus;
  schedules: IClassSchedule[];
  host: { id: string; name: string; image?: string | null };
  createdAt: string;
  updatedAt: string;
  distance?: number | null;
  isFavorite?: boolean;
}

export interface IClassInput {
  name: string;
  sportType: SportType;
  description?: string;
  contactName?: string;
  contactPhone: string;
  zaloUrl?: string;
  requiredLevels?: number[];
  startDate?: string;
  endDate?: string;
  capacity?: number;
  tuitionPeriod: ClassTuitionPeriod;
  tuitionAmount?: number;
  tuitionNotes?: string;
  venueId?: string;
  customLocation?: {
    name: string;
    address?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
    district?: string;
    city?: string;
  };
  coverPhoto?: string;
  images?: string[];
  schedules: IClassSchedule[];
}

export interface IBrowseClassesParams {
  search?: string;
  sportType?: SportType;
  level?: string;
  city?: string;
  district?: string;
  dayOfWeek?: number;
  timeFrom?: string;
  timeTo?: string;
  minTuition?: number;
  maxTuition?: number;
  lat?: number;
  lng?: number;
  sortBy?: 'distance' | 'newest';
  favoriteOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface IClassPage {
  items: IClass[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
