import { api, ApiResponse } from './base';
import {
  IFeedback,
  ICreateFeedbackRequest,
  EFeedbackType,
  EFeedbackStatus,
} from '@/types/feedback';

export const FeedbackService = {
  create: async (data: ICreateFeedbackRequest): Promise<IFeedback> => {
    const response = await api.post<ApiResponse<IFeedback>>('/feedback', data);
    return response.data.data!;
  },

  uploadImage: async (
    file: File
  ): Promise<{ imageUrl: string; imagePublicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<
      ApiResponse<{ imageUrl: string; imagePublicId: string }>
    >('/feedback/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  getMyFeedback: async (filters?: {
    type?: EFeedbackType;
    status?: EFeedbackStatus;
  }): Promise<IFeedback[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const url = params.toString()
      ? `/feedback?${params.toString()}`
      : '/feedback';
    const response = await api.get<ApiResponse<IFeedback[]>>(url);
    return response.data.data || [];
  },

  getAdminFeedback: async (filters?: {
    type?: EFeedbackType;
    status?: EFeedbackStatus;
  }): Promise<IFeedback[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const url = params.toString()
      ? `/feedback/admin?${params.toString()}`
      : '/feedback/admin';
    const response = await api.get<ApiResponse<IFeedback[]>>(url);
    return response.data.data || [];
  },

  updateStatus: async (
    id: string,
    data: { status: EFeedbackStatus; adminNote?: string }
  ): Promise<IFeedback> => {
    const response = await api.patch<ApiResponse<IFeedback>>(
      `/feedback/${id}/status`,
      data
    );
    return response.data.data!;
  },
};
