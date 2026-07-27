import { api, ApiResponse } from './base';

export interface UserOption {
  id: string;
  name: string;
  email: string;
  gender?: string;
  level?: number;
  levelDescription?: string;
}

export interface IPublicProfileMeta {
  id: string;
  name: string;
  image?: string;
  coverPhoto?: string;
  role: string;
  gender?: string;
  level?: number;
  levelDescription?: string;
  phone?: string;
  createdAt: Date | string;
  joinedSessionsCount?: number;
}

export const UserService = {
  /**
   * Get all users for player selection
   */
  async getAllUsers(search?: string): Promise<UserOption[]> {
    const response = await api.get<
      ApiResponse<UserOption[] | { data: UserOption[] }>
    >('/users', {
      params: { search },
    });
    const payload = response.data.data;
    if (Array.isArray(payload)) return payload;
    return payload?.data ?? [];
  },

  /**
   * Get public profile for a user
   */
  async getPublicProfile(userId: string): Promise<IPublicProfileMeta> {
    const response = await api.get<ApiResponse<IPublicProfileMeta>>(
      `/users/public/${userId}`
    );
    return response.data.data!;
  },
};
