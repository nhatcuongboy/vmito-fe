import { toaster } from '@/components/ui/toaster';
import { getToastMessage } from '@/lib/i18n/toastMessages';
import { api, ApiResponse } from './base';
import { Sponsor, CreateSponsorRequest, UpdateSponsorRequest } from './types';

export const SponsorService = {
  // Get all sponsors of a tournament
  getSponsors: async (tournamentId: string): Promise<Sponsor[]> => {
    const response = await api.get<ApiResponse<Sponsor[]>>(
      `/tournaments/${tournamentId}/sponsors`
    );
    return response.data.data || [];
  },

  // Get sponsor by ID
  getSponsor: async (id: string): Promise<Sponsor> => {
    const response = await api.get<ApiResponse<Sponsor>>(`/sponsors/${id}`);
    return response.data.data!;
  },

  // Create sponsor
  createSponsor: async (
    tournamentId: string,
    data: CreateSponsorRequest,
    options?: { showToast?: boolean }
  ): Promise<Sponsor> => {
    const response = await api.post<ApiResponse<Sponsor>>(
      `/tournaments/${tournamentId}/sponsors`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: getToastMessage('sponsorCreatedSuccessfully') });
    }
    return response.data.data!;
  },

  // Update sponsor
  updateSponsor: async (
    id: string,
    data: UpdateSponsorRequest,
    options?: { showToast?: boolean }
  ): Promise<Sponsor> => {
    const response = await api.put<ApiResponse<Sponsor>>(
      `/sponsors/${id}`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: getToastMessage('sponsorUpdatedSuccessfully') });
    }
    return response.data.data!;
  },

  // Delete sponsor
  deleteSponsor: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/sponsors/${id}`);
    toaster.success({ title: getToastMessage('sponsorDeletedSuccessfully') });
  },
};
