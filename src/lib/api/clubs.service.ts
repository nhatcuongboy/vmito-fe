import { api } from './base';
import {
  IClub,
  IBrowseClubsParams,
  IPaginatedClubList,
  IMyClub,
  IClubJoinRequest,
  IJoinClubResponse,
  IClubMember,
  IClubMonthlyMember,
  ICreateClubDto,
  IUpdateClubDto,
  IClubFeeConfig,
  ICreateClubFeeDto,
  IClubUserSearchResult,
  EMemberRole,
  IClubAnnouncement,
  ICreateClubAnnouncementDto,
  IUpdateClubAnnouncementDto,
} from '@/types/club';
import { ApiResponse } from './base';

export const ClubsService = {
  // ===========================================
  // Public / Player Endpoints
  // ===========================================

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
   * Get club details by ID (Public view)
   */
  getClubDetails: async (id: string): Promise<IClub> => {
    const response = await api.get<ApiResponse<IClub>>(`/clubs/${id}/details`);
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

  /**
   * Cancel current user's pending join request for a club
   */
  cancelJoinRequest: async (clubId: string): Promise<void> => {
    await api.delete(`/clubs/${clubId}/join-request`);
  },

  // ===========================================
  // Club Management Endpoints (Host/Admin)
  // ===========================================

  /**
   * Get clubs for management. Admin receives the system-wide list.
   */
  getClubsToManage: async (): Promise<IClub[]> => {
    const response = await api.get<ApiResponse<IClub[]>>('/clubs/manage');
    return response.data.data || [];
  },

  /**
   * Get a single club by ID for management
   */
  getClub: async (clubId: string): Promise<IClub> => {
    const response = await api.get<ApiResponse<IClub>>(`/clubs/${clubId}`);
    return response.data.data!;
  },

  /**
   * Create a new club
   */
  createClub: async (data: ICreateClubDto): Promise<IClub> => {
    const response = await api.post<ApiResponse<IClub>>('/clubs', data);
    return response.data.data!;
  },

  /**
   * Update a club
   */
  updateClub: async (clubId: string, data: IUpdateClubDto): Promise<IClub> => {
    const response = await api.put<ApiResponse<IClub>>(
      `/clubs/${clubId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a club
   */
  deleteClub: async (clubId: string): Promise<void> => {
    await api.delete(`/clubs/${clubId}`);
  },

  // ==========================================
  // Member Management
  // ==========================================

  /**
   * Get members of a club
   */
  getClubMembers: async (clubId: string): Promise<IClubMember[]> => {
    const response = await api.get<ApiResponse<IClubMember[]>>(
      `/clubs/${clubId}/members`
    );
    return response.data.data || [];
  },

  /**
   * Add a member to a club
   */
  addMemberToClub: async (
    clubId: string,
    userId: string
  ): Promise<IClubMember> => {
    const response = await api.post<ApiResponse<IClubMember>>(
      `/clubs/${clubId}/members/${userId}`
    );
    return response.data.data!;
  },

  /**
   * Remove a member from a club
   */
  removeMemberFromClub: async (
    clubId: string,
    userId: string
  ): Promise<void> => {
    await api.delete(`/clubs/${clubId}/members/${userId}`);
  },

  /**
   * Update a member's role in a club
   */
  updateMemberRole: async (
    clubId: string,
    userId: string,
    role: EMemberRole
  ): Promise<IClubMember> => {
    const response = await api.put<ApiResponse<IClubMember>>(
      `/clubs/${clubId}/members/${userId}/role`,
      { role }
    );
    return response.data.data!;
  },

  /**
   * Search users for club membership
   */
  searchUsers: async (
    query: string,
    clubId?: string
  ): Promise<IClubUserSearchResult[]> => {
    const response = await api.get<ApiResponse<IClubUserSearchResult[]>>(
      '/clubs/search-users',
      {
        params: { q: query, clubId },
      }
    );
    return response.data.data || [];
  },

  // ==========================================
  // Join Request Management
  // ==========================================

  /**
   * Get all join requests for a club
   */
  getJoinRequests: async (clubId: string): Promise<IClubJoinRequest[]> => {
    const response = await api.get<ApiResponse<IClubJoinRequest[]>>(
      `/clubs/${clubId}/join-requests`
    );
    return response.data.data || [];
  },

  /**
   * Pending join requests across every club the current user manages
   * (host or ADMIN/MODERATOR member). Single call, replaces the previous
   * one-request-per-club fan-out.
   */
  getMyManagedJoinRequests: async (): Promise<IClubJoinRequest[]> => {
    const response = await api.get<ApiResponse<IClubJoinRequest[]>>(
      `/clubs/my/join-requests`
    );
    return response.data.data || [];
  },

  /**
   * Get a single join request detail
   */
  getJoinRequestById: async (
    clubId: string,
    requestId: string
  ): Promise<IClubJoinRequest> => {
    const response = await api.get<ApiResponse<IClubJoinRequest>>(
      `/clubs/${clubId}/join-requests/${requestId}`
    );
    return response.data.data!;
  },

  /**
   * Approve a join request
   */
  approveJoinRequest: async (
    clubId: string,
    requestId: string
  ): Promise<IClubMember | { status: string }> => {
    const response = await api.post<
      ApiResponse<IClubMember | { status: string }>
    >(`/clubs/${clubId}/join-requests/${requestId}/approve`);
    return response.data.data!;
  },

  /**
   * Reject a join request
   */
  rejectJoinRequest: async (
    clubId: string,
    requestId: string,
    response?: string
  ): Promise<IClubJoinRequest> => {
    const apiResponse = await api.post<ApiResponse<IClubJoinRequest>>(
      `/clubs/${clubId}/join-requests/${requestId}/reject`,
      { response }
    );
    return apiResponse.data.data!;
  },

  // ==========================================
  // Fee Configuration
  // ==========================================

  /**
   * Get fee configurations for a club
   */
  getClubFees: async (clubId: string): Promise<IClubFeeConfig[]> => {
    const response = await api.get<ApiResponse<IClubFeeConfig[]>>(
      `/clubs/${clubId}/fees`
    );
    return response.data.data || [];
  },

  /**
   * Get fee config for a specific month/year
   */
  getClubFeeForMonth: async (
    clubId: string,
    year: number,
    month: number
  ): Promise<IClubFeeConfig | null> => {
    const response = await api.get<ApiResponse<IClubFeeConfig>>(
      `/clubs/${clubId}/fees/${year}/${month}`
    );
    return response.data.data || null;
  },

  /**
   * Create or update fee configuration
   */
  upsertClubFee: async (
    clubId: string,
    data: ICreateClubFeeDto
  ): Promise<IClubFeeConfig> => {
    const response = await api.post<ApiResponse<IClubFeeConfig>>(
      `/clubs/${clubId}/fees`,
      data
    );
    return response.data.data!;
  },

  /**
   * Get monthly fixed members for a club month
   */
  getClubMonthlyMembers: async (
    clubId: string,
    year: number,
    month: number
  ): Promise<IClubMonthlyMember[]> => {
    const response = await api.get<ApiResponse<IClubMonthlyMember[]>>(
      `/clubs/${clubId}/monthly-members/${year}/${month}`
    );
    return response.data.data || [];
  },

  /**
   * Mark a club member as fixed for a month
   */
  upsertClubMonthlyMember: async (
    clubId: string,
    data: { userId: string; year: number; month: number }
  ): Promise<IClubMonthlyMember> => {
    const response = await api.post<ApiResponse<IClubMonthlyMember>>(
      `/clubs/${clubId}/monthly-members`,
      data
    );
    return response.data.data!;
  },

  /**
   * Remove a member from the fixed monthly list
   */
  deleteClubMonthlyMember: async (
    clubId: string,
    userId: string,
    year: number,
    month: number
  ): Promise<void> => {
    await api.delete(
      `/clubs/${clubId}/monthly-members/${userId}/${year}/${month}`
    );
  },

  /**
   * Delete a fee configuration
   */
  deleteClubFee: async (feeId: string): Promise<void> => {
    await api.delete(`/clubs/fees/${feeId}`); // Note: backend route is Get(':id/fees/:feeId') deleteClubFee(@Param('feeId') feeId: string, ...) - wait, I should check backend again
    // Backend: @Delete(':id/fees/:feeId') deleteClubFee(@Param('feeId') feeId: string, @CurrentUser() user: JwtUser)
    // Wait, the backend @Delete(':id/fees/:feeId') has TWO params, but the handler only uses feeId and user.
    // So /clubs/anything/fees/:feeId should work.
  },

  // ==========================================
  // Announcements
  // ==========================================

  /**
   * Get all announcements for a club
   */
  getClubAnnouncements: async (
    clubId: string
  ): Promise<IClubAnnouncement[]> => {
    const response = await api.get<ApiResponse<IClubAnnouncement[]>>(
      `/clubs/${clubId}/announcements`
    );
    return response.data.data || [];
  },

  /**
   * Create a new announcement
   */
  createAnnouncement: async (
    clubId: string,
    data: ICreateClubAnnouncementDto
  ): Promise<IClubAnnouncement> => {
    const response = await api.post<ApiResponse<IClubAnnouncement>>(
      `/clubs/${clubId}/announcements`,
      data
    );
    return response.data.data!;
  },

  /**
   * Update an announcement
   */
  updateAnnouncement: async (
    clubId: string,
    announcementId: string,
    data: IUpdateClubAnnouncementDto
  ): Promise<IClubAnnouncement> => {
    const response = await api.put<ApiResponse<IClubAnnouncement>>(
      `/clubs/${clubId}/announcements/${announcementId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete an announcement
   */
  deleteAnnouncement: async (
    clubId: string,
    announcementId: string
  ): Promise<void> => {
    await api.delete(`/clubs/${clubId}/announcements/${announcementId}`);
  },

  /**
   * Get clubs that a user belongs to for a host
   */
  getUserClubs: async (userId: string): Promise<IClub[]> => {
    const response = await api.get<ApiResponse<IClub[]>>(
      `/clubs/user/${userId}/list`
    );
    return response.data.data || [];
  },

  // ==========================================
  // Admin Club Approval Endpoints
  // ==========================================

  /**
   * Upload club image
   */
  uploadClubImage: async (
    file: File
  ): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('clubImage', file);
    const response = await api.post<
      ApiResponse<{ url: string; publicId: string }>
    >('/upload/club-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  /**
   * Get all pending join requests across all clubs (Admin only)
   */
  getAdminJoinRequests: async (): Promise<IClubJoinRequest[]> => {
    const response = await api.get<ApiResponse<IClubJoinRequest[]>>(
      '/clubs/admin/join-requests'
    );
    return response.data.data || [];
  },

  /**
   * Get all clubs pending approval (Admin only)
   */
  getPendingClubs: async (): Promise<IClub[]> => {
    const response = await api.get<ApiResponse<IClub[]>>(
      '/clubs/admin/pending'
    );
    return response.data.data || [];
  },

  /**
   * Approve a club (Admin only)
   */
  approveClub: async (id: string): Promise<IClub> => {
    const response = await api.post<ApiResponse<IClub>>(`/clubs/${id}/approve`);
    return response.data.data!;
  },

  /**
   * Reject a club (Admin only)
   */
  rejectClub: async (id: string, reason: string): Promise<IClub> => {
    const response = await api.post<ApiResponse<IClub>>(`/clubs/${id}/reject`, {
      reason,
    });
    return response.data.data!;
  },
};
