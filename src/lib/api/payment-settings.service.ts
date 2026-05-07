import { api, ApiResponse } from './base';
import {
  HostPaymentSettings,
  CreateHostPaymentSettingsRequest,
  UpdateHostPaymentSettingsRequest,
} from './types';

export const PaymentSettingsService = {
  // Get current user's payment settings
  getMyPaymentSettings: async (): Promise<HostPaymentSettings[]> => {
    const response =
      await api.get<ApiResponse<HostPaymentSettings[]>>('/payment-settings');
    return response.data.data || [];
  },

  // Get default payment settings
  getDefaultPaymentSettings: async (): Promise<HostPaymentSettings | null> => {
    try {
      const response = await api.get<ApiResponse<HostPaymentSettings>>(
        '/payment-settings/default'
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Get payment settings by host ID (for players to view)
  getHostPaymentSettings: async (
    hostId: string
  ): Promise<HostPaymentSettings | null> => {
    try {
      const response = await api.get<ApiResponse<HostPaymentSettings>>(
        `/hosts/${hostId}/payment-settings`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Create payment settings
  createPaymentSettings: async (
    data: CreateHostPaymentSettingsRequest
  ): Promise<HostPaymentSettings> => {
    const response = await api.post<ApiResponse<HostPaymentSettings>>(
      '/payment-settings',
      data
    );
    return response.data.data!;
  },

  // Update payment settings
  updatePaymentSettings: async (
    id: string,
    data: UpdateHostPaymentSettingsRequest
  ): Promise<HostPaymentSettings> => {
    const response = await api.put<ApiResponse<HostPaymentSettings>>(
      `/payment-settings/${id}`,
      data
    );
    return response.data.data!;
  },

  // Delete payment settings
  deletePaymentSettings: async (id: string): Promise<void> => {
    await api.delete(`/payment-settings/${id}`);
  },

  // Set as default payment settings
  setDefaultPaymentSettings: async (
    id: string
  ): Promise<HostPaymentSettings> => {
    const response = await api.post<ApiResponse<HostPaymentSettings>>(
      `/payment-settings/${id}/set-default`,
      {}
    );
    return response.data.data!;
  },

  // Upload QR code image
  uploadQRCode: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('qrCode', file);
    const response = await api.post<ApiResponse<{ url: string }>>(
      '/upload/qr-code',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!.url;
  },
};
