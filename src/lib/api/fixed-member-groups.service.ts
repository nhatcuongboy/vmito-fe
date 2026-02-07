import { api } from './base';
import type {
  IFixedMemberGroup,
  IFixedMemberGroupFeeConfig,
  IFixedMemberGroupMember,
  ICreateGroupDto,
  IUpdateGroupDto,
  ICreateGroupFeeDto,
  IUserSearchResult,
} from '@/types/fixed-member';
import { ApiResponse } from './base';

export const FixedMemberGroupsService = {
  // ==========================================
  // Group Management
  // ==========================================

  /**
   * Get all fixed member groups for the current host
   */
  async getGroups(): Promise<IFixedMemberGroup[]> {
    const response = await api.get<ApiResponse<IFixedMemberGroup[]>>(
      '/fixed-member-groups'
    );
    return response.data.data || [];
  },

  /**
   * Get a single group by ID
   */
  async getGroup(groupId: string): Promise<IFixedMemberGroup> {
    const response = await api.get<ApiResponse<IFixedMemberGroup>>(
      `/fixed-member-groups/${groupId}`
    );
    return response.data.data!;
  },

  /**
   * Create a new group
   */
  async createGroup(data: ICreateGroupDto): Promise<IFixedMemberGroup> {
    const response = await api.post<ApiResponse<IFixedMemberGroup>>(
      '/fixed-member-groups',
      data
    );
    return response.data.data!;
  },

  /**
   * Update a group
   */
  async updateGroup(
    groupId: string,
    data: IUpdateGroupDto
  ): Promise<IFixedMemberGroup> {
    const response = await api.put<ApiResponse<IFixedMemberGroup>>(
      `/fixed-member-groups/${groupId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/fixed-member-groups/${groupId}`);
  },

  // ==========================================
  // Member Management
  // ==========================================

  /**
   * Get members of a group
   */
  async getGroupMembers(groupId: string): Promise<IFixedMemberGroupMember[]> {
    const response = await api.get<ApiResponse<IFixedMemberGroupMember[]>>(
      `/fixed-member-groups/${groupId}/members`
    );
    return response.data.data || [];
  },

  /**
   * Add a member to a group
   */
  async addMemberToGroup(
    groupId: string,
    userId: string
  ): Promise<IFixedMemberGroupMember> {
    const response = await api.post<ApiResponse<IFixedMemberGroupMember>>(
      `/fixed-member-groups/${groupId}/members/${userId}`
    );
    return response.data.data!;
  },

  /**
   * Remove a member from a group
   */
  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    await api.delete(`/fixed-member-groups/${groupId}/members/${userId}`);
  },

  /**
   * Search users to add to a group
   */
  async searchUsers(query: string): Promise<IUserSearchResult[]> {
    const response = await api.get<ApiResponse<IUserSearchResult[]>>(
      `/fixed-member-groups/search-users`,
      {
        params: { q: query },
      }
    );
    return response.data.data || [];
  },

  // ==========================================
  // Fee Configuration
  // ==========================================

  /**
   * Get fee configurations for a group
   */
  async getGroupFees(groupId: string): Promise<IFixedMemberGroupFeeConfig[]> {
    const response = await api.get<ApiResponse<IFixedMemberGroupFeeConfig[]>>(
      `/fixed-member-groups/${groupId}/fees`
    );
    return response.data.data || [];
  },

  /**
   * Get fee config for a specific month/year
   */
  async getGroupFeeForMonth(
    groupId: string,
    year: number,
    month: number
  ): Promise<IFixedMemberGroupFeeConfig | null> {
    const response = await api.get<ApiResponse<IFixedMemberGroupFeeConfig>>(
      `/fixed-member-groups/${groupId}/fees/${year}/${month}`
    );
    return response.data.data || null;
  },

  /**
   * Create or update fee configuration
   */
  async upsertGroupFee(
    groupId: string,
    data: ICreateGroupFeeDto
  ): Promise<IFixedMemberGroupFeeConfig> {
    const response = await api.post<ApiResponse<IFixedMemberGroupFeeConfig>>(
      `/fixed-member-groups/${groupId}/fees`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a fee configuration
   */
  async deleteGroupFee(groupId: string, feeId: string): Promise<void> {
    await api.delete(`/fixed-member-groups/${groupId}/fees/${feeId}`);
  },

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Get groups that a user belongs to
   */
  async getUserGroups(userId: string): Promise<IFixedMemberGroup[]> {
    const response = await api.get<ApiResponse<IFixedMemberGroup[]>>(
      `/fixed-member-groups/user/${userId}/groups`
    );
    return response.data.data || [];
  },
};
