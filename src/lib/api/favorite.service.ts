import { api, ApiResponse } from './base';

export type FavoriteType = 'SESSION' | 'VENUE' | 'CLUB' | 'TOURNAMENT';

export interface FavoriteItem<T = unknown> {
  id: string;
  type: FavoriteType;
  targetId: string;
  createdAt: string;
  target?: T;
}

export interface FavoriteListResponse<T = unknown> {
  data: FavoriteItem<T>[];
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
  ): Promise<FavoriteItem> => {
    const response = await api.post<ApiResponse<FavoriteItem>>('/favorites', {
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

  getFavorites: async <T = unknown>(filters?: {
    type?: FavoriteType;
    page?: number;
    limit?: number;
  }): Promise<FavoriteListResponse<T>> => {
    const response = await api.get<ApiResponse<FavoriteListResponse<T>>>(
      '/favorites',
      { params: filters }
    );
    return response.data.data!;
  },
};
