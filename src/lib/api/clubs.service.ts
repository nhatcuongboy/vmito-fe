import { api } from './base';
import {
  IClub,
  IBrowseClubsParams,
  IPaginatedClubList,
  IMyClub,
  IClubJoinRequest,
  IJoinClubResponse,
} from '@/types/club';
import { ApiResponse } from './base';

export const ClubsService = {
  /**
   * Browse public clubs
   */
  browseClubs: async (
    params?: IBrowseClubsParams
  ): Promise<IPaginatedClubList> => {
    const response = await api.get<ApiResponse<IPaginatedClubList>>('/clubs', {
      params,
    });
    return response.data.data!;
  },

  /**
   * Get club details by ID
   */
  getClubDetails: async (id: string): Promise<IClub> => {
    const response = await api.get<ApiResponse<IClub>>(`/clubs/${id}`);
    return response.data.data!;
  },

  /**
   * Request to join a club
   */
  requestToJoin: async (
    clubId: string,
    message?: string
  ): Promise<IJoinClubResponse> => {
    const response = await api.post<ApiResponse<IJoinClubResponse>>(
      `/clubs/${clubId}/join`,
      { message }
    );
    return response.data.data!;
  },

  /**
   * Leave a club
   */
  leaveClub: async (clubId: string): Promise<{ message: string }> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/clubs/${clubId}/leave`
    );
    return response.data.data!;
  },

  /**
   * Get current user's clubs
   */
  getMyClubs: async (): Promise<IMyClub[]> => {
    const response = await api.get<ApiResponse<IMyClub[]>>('/clubs/my/list');
    return response.data.data || [];
  },

  /**
   * Get current user's join requests
   */
  getMyJoinRequests: async (): Promise<IClubJoinRequest[]> => {
    const response =
      await api.get<ApiResponse<IClubJoinRequest[]>>('/clubs/my/requests');
    return response.data.data || [];
  },
};
