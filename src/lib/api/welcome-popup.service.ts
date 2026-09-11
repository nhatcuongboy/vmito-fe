import { api } from './base';
import {
  ApiResponse,
  ICreateWelcomePopupDto,
  IUpdateWelcomePopupDto,
  IWelcomePopup,
} from './types';

export const WelcomePopupService = {
  /**
   * Get the single highest-priority active popup for the current visitor (public).
   */
  getActive: async (): Promise<IWelcomePopup | null> => {
    const response = await api.get<ApiResponse<IWelcomePopup | null>>(
      '/welcome-popups/active'
    );
    return response.data.data ?? null;
  },

  /**
   * Get all popups (Admin only)
   */
  getAdminList: async (): Promise<IWelcomePopup[]> => {
    const response = await api.get<ApiResponse<IWelcomePopup[]>>(
      '/admin/welcome-popups'
    );
    return response.data.data || [];
  },

  /**
   * Create a popup (Admin only)
   */
  create: async (data: ICreateWelcomePopupDto): Promise<IWelcomePopup> => {
    const response = await api.post<ApiResponse<IWelcomePopup>>(
      '/admin/welcome-popups',
      data
    );
    return response.data.data!;
  },

  /**
   * Update a popup (Admin only)
   */
  update: async (
    id: string,
    data: IUpdateWelcomePopupDto
  ): Promise<IWelcomePopup> => {
    const response = await api.put<ApiResponse<IWelcomePopup>>(
      `/admin/welcome-popups/${id}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a popup (Admin only)
   */
  remove: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<{ success: boolean }>>(
      `/admin/welcome-popups/${id}`
    );
  },

  /**
   * Upload a banner image for a popup (Admin only)
   */
  uploadBanner: async (
    file: File
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post<
      ApiResponse<{ url: string; publicId: string }>
    >('/admin/welcome-popups/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },
};
