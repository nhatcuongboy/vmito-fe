import { api, ApiResponse } from './base';
import {
  VenueRequest,
  VenueRequestPayload,
  VenueRequestStatus,
  VenueRequestType,
} from './types';

export const VenueRequestService = {
  create: async (data: {
    type: VenueRequestType;
    venueId?: string;
    payload: VenueRequestPayload;
  }): Promise<VenueRequest> => {
    const response = await api.post<ApiResponse<VenueRequest>>(
      '/venue-requests',
      data
    );
    return response.data.data!;
  },

  getMine: async (filters?: {
    type?: VenueRequestType;
    status?: VenueRequestStatus;
  }): Promise<VenueRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const url = params.toString()
      ? `/venue-requests/my?${params.toString()}`
      : '/venue-requests/my';
    const response = await api.get<ApiResponse<VenueRequest[]>>(url);
    return response.data.data || [];
  },

  getAdmin: async (filters?: {
    type?: VenueRequestType;
    status?: VenueRequestStatus;
  }): Promise<VenueRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const url = params.toString()
      ? `/venue-requests/admin?${params.toString()}`
      : '/venue-requests/admin';
    const response = await api.get<ApiResponse<VenueRequest[]>>(url);
    return response.data.data || [];
  },

  approve: async (id: string): Promise<VenueRequest> => {
    const response = await api.post<ApiResponse<VenueRequest>>(
      `/venue-requests/${id}/approve`
    );
    return response.data.data!;
  },

  reject: async (id: string, adminNote: string): Promise<VenueRequest> => {
    const response = await api.post<ApiResponse<VenueRequest>>(
      `/venue-requests/${id}/reject`,
      { adminNote }
    );
    return response.data.data!;
  },
};
