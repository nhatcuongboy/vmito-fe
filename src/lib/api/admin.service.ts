import { api } from './base';
import { ApiResponse } from './types';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'HOST' | 'PLAYER' | 'ADMIN';
  image?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  level?: number;
  levelDescription?: string;
  phone?: string;
  emailVerified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password?: string;
  role: 'HOST' | 'PLAYER' | 'ADMIN';
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  level?: number;
  levelDescription?: string;
  image?: string;
  password?: string;
  role?: 'HOST' | 'PLAYER' | 'ADMIN';
}

export const AdminService = {
  /**
   * Get all users (Admin only)
   */
  getUsers: async (params?: {
    search?: string;
    role?: string;
  }): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    const response = await api.get<ApiResponse<User[]>>(url);
    return response.data.data || [];
  },

  /**
   * Get single user
   */
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  /**
   * Create new user (Admin only)
   */
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data!;
  },

  /**
   * Update user (Admin only)
   */
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data!;
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
