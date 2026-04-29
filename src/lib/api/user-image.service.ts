import { api, ApiResponse } from './base';
import { IUserImage, IUserImageListResponse, EImageCategory } from './types';

export const UserImageService = {
  getMyImages: async (
    category?: EImageCategory,
    page?: number,
    limit?: number
  ): Promise<IUserImageListResponse> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get<ApiResponse<IUserImageListResponse>>(
      `/user-images?${params.toString()}`
    );
    return response.data.data!;
  },

  uploadImage: async (
    file: File,
    category: EImageCategory = EImageCategory.OTHER
  ): Promise<IUserImage> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<IUserImage>>(
      `/user-images?category=${category}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for uploads
      }
    );
    return response.data.data!;
  },

  deleteImage: async (id: string): Promise<void> => {
    await api.delete(`/user-images/${id}`);
  },
};
