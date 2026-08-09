import { api, ApiResponse } from './base';

export type FavoriteType =
  | 'SESSION'
  | 'CLASS'
  | 'VENUE'
  | 'CLUB'
  | 'TOURNAMENT';

/**
 * GET /favorites does not wrap the target in a `target` field - the backend
 * spreads the favorited Session/Venue/Club/Tournament fields directly and
 * adds `isFavorite`/`favoritedAt` on top, since Favorite is polymorphic
 * (joined manually via type+targetId, no FK relation).
 */
export interface FavoriteTargetSummary {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  images?: string[];
  coverPhoto?: string;
  address?: string;
  city?: string;
  district?: string;
  host?: { id: string; name: string; image?: string };
  venue?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    district?: string;
  };
  defaultVenue?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    district?: string;
  };
  _count?: {
    players?: number;
    pairs?: number;
    categories?: number;
    members?: number;
  };
  isFavorite: true;
  favoritedAt: string;
}

export interface FavoriteListResponse {
  data: FavoriteTargetSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  type: FavoriteType;
  targetId: string;
  createdAt: string;
}

export interface FavoriteSummary {
  isFavorite: boolean;
  favoriteCount: number;
  canViewUsers: boolean;
}

export interface FavoriteUser {
  id: string;
  name: string;
  image?: string | null;
  favoritedAt: string;
}

export interface FavoriteUsersResponse {
  data: FavoriteUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const FavoriteService = {
  addFavorite: async (
    type: FavoriteType,
    targetId: string
  ): Promise<FavoriteRecord> => {
    const response = await api.post<ApiResponse<FavoriteRecord>>('/favorites', {
      type,
      targetId,
    });
    return response.data.data!;
  },

  removeFavorite: async (
    type: FavoriteType,
    targetId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/favorites/${type}/${targetId}`);
  },

  getFavorites: async (filters: {
    type: FavoriteType;
    page?: number;
    limit?: number;
  }): Promise<FavoriteListResponse> => {
    const response = await api.get<ApiResponse<FavoriteListResponse>>(
      '/favorites',
      { params: filters }
    );
    return response.data.data!;
  },

  getSummary: async (
    type: FavoriteType,
    targetId: string
  ): Promise<FavoriteSummary> => {
    const response = await api.get<ApiResponse<FavoriteSummary>>(
      `/favorites/${type}/${targetId}/summary`
    );
    return response.data.data!;
  },

  getFavoriteUsers: async (
    type: FavoriteType,
    targetId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<FavoriteUsersResponse> => {
    const response = await api.get<ApiResponse<FavoriteUsersResponse>>(
      `/favorites/${type}/${targetId}/users`,
      { params }
    );
    return response.data.data!;
  },
};
