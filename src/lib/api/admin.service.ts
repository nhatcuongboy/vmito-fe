import { api } from './base';
import { ApiResponse, UserRole, GenderType } from './types';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
  imagePublicId?: string;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  phone?: string;
  emailVerified?: string;
  /**
   * How the user registered: 'email' (direct password sign-up) or an OAuth
   * provider ('google', 'facebook', 'zalo', 'apple'). Derived server-side.
   */
  registrationProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  gender?: GenderType;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  gender?: GenderType;
  level?: number;
  levelDescription?: string;
  image?: string;
  imagePublicId?: string;
  coverPhoto?: string;
  coverPhotoPublicId?: string;
  password?: string;
  role?: UserRole;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type UsersApiResponse = ApiResponse<User[] | PaginatedUsers> & {
  pagination?: PaginatedUsers['pagination'];
};

export const AdminService = {
  /**
   * Get all users (Admin only)
   */
  getUsers: async (params?: {
    search?: string;
    role?: string;
  }): Promise<User[]> => {
    const result = await AdminService.getUsersPaginated(params);
    return result.data;
  },

  /**
   * Get users with pagination (Admin only)
   */
  getUsersPaginated: async (params?: {
    search?: string;
    role?: string;
    gender?: string;
    provider?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedUsers> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.gender) searchParams.set('gender', params.gender);
    if (params?.provider) searchParams.set('provider', params.provider);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';

    const response = await api.get<UsersApiResponse>(url);
    const payload = response.data.data;
    const topLevelPagination = response.data.pagination;

    if (Array.isArray(payload)) {
      const limit = params?.limit ?? payload.length;
      const page = params?.page ?? 1;
      const start = (page - 1) * limit;

      return {
        data: topLevelPagination
          ? payload
          : params?.limit
            ? payload.slice(start, start + limit)
            : payload,
        pagination: {
          page: topLevelPagination?.page ?? page,
          limit: topLevelPagination?.limit ?? limit,
          total: topLevelPagination?.total ?? payload.length,
          totalPages:
            topLevelPagination?.totalPages ??
            (limit ? Math.ceil(payload.length / limit) : 0),
        },
      };
    }

    return (
      payload || {
        data: [],
        pagination: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 0,
          total: 0,
          totalPages: 0,
        },
      }
    );
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

  uploadAvatar: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<
      ApiResponse<{ url: string; publicId: string }>
    >('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return response.data.data!;
  },

  uploadCover: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('cover', file);
    const response = await api.post<
      ApiResponse<{ url: string; publicId: string }>
    >('/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return response.data.data!;
  },

  /**
   * Delete user (Admin only)
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
