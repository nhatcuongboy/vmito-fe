import { api, ApiResponse } from './base';

export interface UserOption {
  id: string;
  name: string;
  email: string;
  gender?: string;
  level?: string;
  levelDescription?: string;
}

export const UserService = {
  /**
   * Get all users for player selection
   */
  async getAllUsers(): Promise<UserOption[]> {
    const response = await api.get<ApiResponse<UserOption[]>>('/users');
    return response.data.data || [];
  },
};
