import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse, dedupGet } from './base';
import {
  Category,
  CategoryRegistration,
  CategoryMatch,
  CategoryGroupStageCompletion,
  CategoryGroup,
  CategoryGroupRegistration,
  GroupStandingsResponse,
  CategoryStandingsResponse,
  UpdateCategoryRequest,
  CreateCategoryRegistrationRequest,
  CreateCategoryMatchRequest,
  EndCategoryMatchRequest,
  IBulkScheduleItem,
  LiveScoreUpdateRequest,
  MatchStatus,
  UpdateSetScoreRequest,
} from './types';

export const CategoryService = {
  // Get all categories of a tournament
  getCategories: async (tournamentId: string): Promise<Category[]> => {
    const response = await dedupGet<ApiResponse<Category[]>>(
      `/tournaments/${tournamentId}/categories`
    );
    return response.data.data || [];
  },

  // Get category by ID
  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data!;
  },

  getGroupStageCompletion: async (
    categoryId: string
  ): Promise<CategoryGroupStageCompletion> => {
    const response = await api.get<ApiResponse<CategoryGroupStageCompletion>>(
      `/categories/${categoryId}/group-stage-completion`
    );
    return response.data.data!;
  },

  // Create category
  createCategory: async (
    tournamentId: string,
    data: {
      name: string;
      type: string;
      format?: string;
      registrationMode?: string;
      teamSize?: number;
      matchFormat?: string;
      pointsToWin?: number;
      winByTwo?: boolean;
      pointCap?: number | null;
    }
  ): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>(
      `/tournaments/${tournamentId}/categories`,
      data
    );
    toaster.success({ title: 'Category created successfully' });
    return response.data.data!;
  },

  // Update category
  updateCategory: async (
    id: string,
    data: UpdateCategoryRequest,
    options?: { showToast?: boolean }
  ): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(
      `/categories/${id}`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Category updated successfully' });
    }
    return response.data.data!;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/categories/${id}`);
    toaster.success({ title: 'Category deleted successfully' });
  },

  // Registration management
  getRegistrations: async (
    categoryId: string
  ): Promise<CategoryRegistration[]> => {
    const response = await dedupGet<ApiResponse<CategoryRegistration[]>>(
      `/categories/${categoryId}/registrations`
    );
    return response.data.data || [];
  },

  getRegistration: async (
    categoryId: string,
    registrationId: string
  ): Promise<CategoryRegistration> => {
    const response = await api.get<ApiResponse<CategoryRegistration>>(
      `/categories/${categoryId}/registrations/${registrationId}`
    );
    return response.data.data!;
  },

  getRegistrationMatches: async (
    categoryId: string,
    registrationId: string
  ): Promise<CategoryMatch[]> => {
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/categories/${categoryId}/registrations/${registrationId}/matches`
    );
    return response.data.data || [];
  },

  createRegistration: async (
    categoryId: string,
    data: CreateCategoryRegistrationRequest,
    options?: { showToast?: boolean }
  ): Promise<CategoryRegistration> => {
    const response = await api.post<ApiResponse<CategoryRegistration>>(
      `/categories/${categoryId}/registrations`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Registration created successfully' });
    }
    return response.data.data!;
  },

  convertLegacyRegistrationToPair: async (
    categoryId: string,
    registrationId: string,
    data: {
      name?: string;
      playerIds: string[];
      type?: string;
      notes?: string;
    }
  ): Promise<CategoryRegistration> => {
    const response = await api.put<ApiResponse<CategoryRegistration>>(
      `/categories/${categoryId}/registrations/${registrationId}/convert-to-pair`,
      data
    );
    toaster.success({ title: 'Team roster saved successfully' });
    return response.data.data!;
  },

  deleteRegistration: async (
    categoryId: string,
    registrationId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/categories/${categoryId}/registrations/${registrationId}`
    );
    toaster.success({ title: 'Registration removed successfully' });
  },

  // Match management
  getMatches: async (categoryId: string): Promise<CategoryMatch[]> => {
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/categories/${categoryId}/matches`
    );
    return response.data.data || [];
  },

  createMatch: async (
    categoryId: string,
    data: CreateCategoryMatchRequest
  ): Promise<CategoryMatch> => {
    const response = await api.post<ApiResponse<CategoryMatch>>(
      `/categories/${categoryId}/matches`,
      data
    );
    return response.data.data!;
  },

  getMatch: async (id: string): Promise<CategoryMatch> => {
    const response = await api.get<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}`
    );
    return response.data.data!;
  },

  updateMatch: async (
    id: string,
    data: Partial<CategoryMatch>,
    options?: { showToast?: boolean }
  ): Promise<CategoryMatch> => {
    const response = await api.put<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}`,
      data
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Match updated successfully' });
    }
    return response.data.data!;
  },

  deleteMatch: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/category-matches/${id}`);
    toaster.success({ title: 'Match deleted successfully' });
  },

  startMatch: async (id: string): Promise<CategoryMatch> => {
    const response = await api.post<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}/start`
    );
    toaster.success({ title: 'Match started' });
    return response.data.data!;
  },

  endMatch: async (
    id: string,
    data: EndCategoryMatchRequest
  ): Promise<CategoryMatch> => {
    const response = await api.post<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}/end`,
      data
    );
    toaster.success({ title: 'Match ended successfully' });
    return response.data.data!;
  },

  resetMatchResult: async (
    id: string,
    options?: { showToast?: boolean }
  ): Promise<CategoryMatch> => {
    const resetPayload = {
      status: MatchStatus.SCHEDULED,
      score: null,
      sets: [],
      winnerId: null,
      isDraw: false,
      isForfeit: false,
      player1Score: null,
      player2Score: null,
      player3Score: null,
      player4Score: null,
      player1Points: null,
      player2Points: null,
      notes: null,
      refereeName: null,
      endTime: null,
    } as unknown as Partial<CategoryMatch>;

    try {
      const response = await api.post<ApiResponse<CategoryMatch>>(
        `/category-matches/${id}/reset-result`,
        undefined,
        { skipGlobalError: true }
      );
      if (options?.showToast !== false) {
        toaster.success({ title: 'Match result reset successfully' });
      }
      return response.data.data!;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404 && status !== 405) {
        throw error;
      }

      const response = await api.put<ApiResponse<CategoryMatch>>(
        `/category-matches/${id}`,
        resetPayload
      );
      if (options?.showToast !== false) {
        toaster.success({ title: 'Match result reset successfully' });
      }
      return response.data.data!;
    }
  },

  // Live scoring (host / admin / assigned referee). No toaster — high frequency.
  liveUpdateScore: async (
    id: string,
    data: LiveScoreUpdateRequest
  ): Promise<CategoryMatch> => {
    const response = await api.patch<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}/score`,
      data,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  undoLastPoint: async (id: string): Promise<CategoryMatch> => {
    const response = await api.patch<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}/score/undo`,
      undefined,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  // Overwrite a single set's score (referee correction). High-stakes mutation
  // — surfaces the global error toaster on failure so the referee notices.
  updateSetScore: async (
    id: string,
    setNumber: number,
    data: UpdateSetScoreRequest
  ): Promise<CategoryMatch> => {
    const response = await api.patch<ApiResponse<CategoryMatch>>(
      `/category-matches/${id}/sets/${setNumber}/score`,
      data
    );
    return response.data.data!;
  },

  // Referee assignment (host / admin)
  assignReferee: async (
    matchId: string,
    refereeId: string,
    options?: { showToast?: boolean }
  ): Promise<CategoryMatch> => {
    const response = await api.patch<ApiResponse<CategoryMatch>>(
      `/category-matches/${matchId}/referee`,
      { refereeId }
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Referee assigned' });
    }
    return response.data.data!;
  },

  unassignReferee: async (
    matchId: string,
    options?: { showToast?: boolean }
  ): Promise<CategoryMatch> => {
    const response = await api.delete<ApiResponse<CategoryMatch>>(
      `/category-matches/${matchId}/referee`
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Referee unassigned' });
    }
    return response.data.data!;
  },

  // Matches assigned to the current user (referee)
  getMyAssignments: async (
    tournamentId?: string,
    status?: string
  ): Promise<CategoryMatch[]> => {
    const params = new URLSearchParams();
    if (tournamentId) params.set('tournamentId', tournamentId);
    if (status) params.set('status', status);
    const qs = params.toString();
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/category-matches/my-assignments${qs ? `?${qs}` : ''}`
    );
    return response.data.data || [];
  },

  // Standings
  getGroupStandings: async (
    categoryId: string,
    groupId: string
  ): Promise<GroupStandingsResponse> => {
    const response = await api.get<ApiResponse<GroupStandingsResponse>>(
      `/categories/${categoryId}/groups/${groupId}/standings`
    );
    return response.data.data!;
  },

  getAllStandings: async (
    categoryId: string
  ): Promise<CategoryStandingsResponse> => {
    const response = await api.get<ApiResponse<CategoryStandingsResponse>>(
      `/categories/${categoryId}/standings`
    );
    return response.data.data || [];
  },

  calculateStandings: async (
    categoryId: string,
    groupId: string
  ): Promise<GroupStandingsResponse> => {
    const response = await api.post<ApiResponse<GroupStandingsResponse>>(
      `/categories/${categoryId}/groups/${groupId}/calculate-standings`
    );
    toaster.success({ title: 'Standings recalculated' });
    return response.data.data!;
  },

  getGroupWinners: async (
    categoryId: string,
    groupId: string
  ): Promise<unknown[]> => {
    const response = await api.get<ApiResponse<unknown[]>>(
      `/categories/${categoryId}/groups/${groupId}/winners`
    );
    return response.data.data || [];
  },

  // Group management
  createGroups: async (
    categoryId: string,
    options?: { showToast?: boolean }
  ): Promise<CategoryGroup[]> => {
    const response = await api.post<ApiResponse<CategoryGroup[]>>(
      `/categories/${categoryId}/groups`
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Groups created successfully' });
    }
    return response.data.data!;
  },

  getGroups: async (categoryId: string): Promise<CategoryGroup[]> => {
    const response = await api.get<ApiResponse<CategoryGroup[]>>(
      `/categories/${categoryId}/groups`
    );
    return response.data.data || [];
  },

  updateGroup: async (
    categoryId: string,
    groupId: string,
    data: Partial<CategoryGroup>
  ): Promise<CategoryGroup> => {
    const response = await api.put<ApiResponse<CategoryGroup>>(
      `/categories/${categoryId}/groups/${groupId}`,
      data
    );
    toaster.success({ title: 'Group updated successfully' });
    return response.data.data!;
  },

  deleteGroup: async (
    categoryId: string,
    groupId: string,
    options?: { showToast?: boolean }
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/categories/${categoryId}/groups/${groupId}`
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Group deleted successfully' });
    }
  },

  // Group registration assignment
  assignRegistrationToGroup: async (
    categoryId: string,
    groupId: string,
    registrationId: string
  ): Promise<CategoryGroupRegistration> => {
    const response = await api.post<ApiResponse<CategoryGroupRegistration>>(
      `/categories/${categoryId}/groups/${groupId}/registrations`,
      { categoryRegistrationId: registrationId }
    );
    toaster.success({ title: 'Registration assigned to group successfully' });
    return response.data.data!;
  },

  removeRegistrationFromGroup: async (
    categoryId: string,
    groupId: string,
    registrationId: string
  ): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/categories/${categoryId}/groups/${groupId}/registrations/${registrationId}`
    );
    toaster.success({ title: 'Registration removed from group successfully' });
  },

  bulkAssignRegistrationsToGroup: async (
    categoryId: string,
    groupId: string,
    registrationIds: string[],
    options?: { showToast?: boolean }
  ): Promise<CategoryGroupRegistration[]> => {
    const response = await api.post<ApiResponse<CategoryGroupRegistration[]>>(
      `/categories/${categoryId}/groups/${groupId}/registrations/bulk`,
      { categoryRegistrationIds: registrationIds }
    );
    if (options?.showToast !== false) {
      toaster.success({
        title: `Successfully assigned ${registrationIds.length} registration(s) to group`,
      });
    }
    return response.data.data!;
  },

  autoAssignAllRegistrations: async (
    categoryId: string,
    options?: { shuffle?: boolean; showToast?: boolean }
  ): Promise<Record<string, CategoryGroupRegistration[]>> => {
    const { showToast, ...requestOptions } = options ?? {};
    const response = await api.post<
      ApiResponse<Record<string, CategoryGroupRegistration[]>>
    >(`/categories/${categoryId}/groups/auto-assign`, requestOptions);
    if (showToast !== false) {
      toaster.success({ title: 'Teams auto-assigned to groups successfully' });
    }
    return response.data.data!;
  },

  // Match generation
  generateGroupMatches: async (
    categoryId: string,
    groupId: string
  ): Promise<CategoryMatch[]> => {
    const response = await api.post<ApiResponse<CategoryMatch[]>>(
      `/categories/${categoryId}/groups/${groupId}/generate-matches`
    );
    toaster.success({ title: 'Matches generated successfully' });
    return response.data.data!;
  },

  generateAllGroupMatches: async (
    categoryId: string,
    options?: { showToast?: boolean }
  ): Promise<Array<{ group: CategoryGroup; matches: CategoryMatch[] }>> => {
    const response = await api.post<
      ApiResponse<Array<{ group: CategoryGroup; matches: CategoryMatch[] }>>
    >(`/categories/${categoryId}/groups/generate-all-matches`);
    if (options?.showToast !== false) {
      toaster.success({ title: 'All matches generated successfully' });
    }
    return response.data.data!;
  },

  getGroupMatches: async (
    categoryId: string,
    groupId: string
  ): Promise<CategoryMatch[]> => {
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/categories/${categoryId}/groups/${groupId}/matches`
    );
    return response.data.data || [];
  },

  // Complete group stage / generate the elimination bracket
  completeGroupStage: async (
    categoryId: string,
    options?: { showToast?: boolean }
  ): Promise<unknown> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/categories/${categoryId}/complete-group-stage`
    );
    if (options?.showToast !== false) {
      toaster.success({ title: 'Group stage completed successfully' });
    }
    return response.data.data!;
  },

  bulkUpdateSchedule: async (updates: IBulkScheduleItem[]): Promise<void> => {
    await api.put<ApiResponse<null>>('/category-matches/bulk-schedule', {
      updates,
    });
  },
};
