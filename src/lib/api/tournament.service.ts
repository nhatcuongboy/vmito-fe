import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  Tournament,
  CreateTournamentRequest,
  TournamentUmpire,
  TournamentScoringDevice,
  TournamentCourt,
  CategoryMatch,
  ScheduleType,
  TournamentVenue,
} from './types';

export const TournamentService = {
  // Get all tournaments (public)
  getAllTournaments: async (): Promise<Tournament[]> => {
    const response = await api.get<ApiResponse<Tournament[]>>('/tournaments');
    return response.data.data || [];
  },

  // Get my tournaments (host only)
  getMyTournaments: async (): Promise<Tournament[]> => {
    const response =
      await api.get<ApiResponse<Tournament[]>>('/tournaments/my');
    return response.data.data || [];
  },

  // Get tournament by ID
  getTournament: async (id: string): Promise<Tournament> => {
    const response = await api.get<ApiResponse<Tournament>>(
      `/tournaments/${id}`
    );
    return response.data.data!;
  },

  // Create tournament
  createTournament: async (
    data: CreateTournamentRequest
  ): Promise<Tournament> => {
    const response = await api.post<ApiResponse<Tournament>>(
      '/tournaments',
      data
    );
    toaster.success({ title: 'Tournament created successfully' });
    return response.data.data!;
  },

  // Update tournament
  updateTournament: async (
    id: string,
    data: Partial<Tournament>
  ): Promise<Tournament> => {
    const response = await api.put<ApiResponse<Tournament>>(
      `/tournaments/${id}`,
      data
    );
    toaster.success({ title: 'Tournament updated successfully' });
    return response.data.data!;
  },

  // Publish tournament
  publishTournament: async (id: string): Promise<Tournament> => {
    const response = await api.put<ApiResponse<Tournament>>(
      `/tournaments/${id}`,
      { isPublished: true }
    );
    toaster.success({ title: 'Tournament published successfully' });
    return response.data.data!;
  },

  // Unpublish tournament (set to draft)
  unpublishTournament: async (id: string): Promise<Tournament> => {
    const response = await api.put<ApiResponse<Tournament>>(
      `/tournaments/${id}`,
      { isPublished: false }
    );
    toaster.success({ title: 'Tournament set to draft' });
    return response.data.data!;
  },

  // Delete tournament
  deleteTournament: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournaments/${id}`);
    toaster.success({ title: 'Tournament deleted successfully' });
  },

  // Umpire management
  getUmpires: async (tournamentId: string): Promise<TournamentUmpire[]> => {
    const response = await api.get<ApiResponse<TournamentUmpire[]>>(
      `/tournaments/${tournamentId}/umpires`
    );
    return response.data.data || [];
  },

  addUmpire: async (
    tournamentId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      notes?: string;
    }
  ): Promise<TournamentUmpire> => {
    const response = await api.post<ApiResponse<TournamentUmpire>>(
      `/tournaments/${tournamentId}/umpires`,
      data
    );
    toaster.success({ title: 'Umpire added successfully' });
    return response.data.data!;
  },

  updateUmpire: async (
    id: string,
    data: Partial<TournamentUmpire>
  ): Promise<TournamentUmpire> => {
    const response = await api.put<ApiResponse<TournamentUmpire>>(
      `/tournament-umpires/${id}`,
      data
    );
    toaster.success({ title: 'Umpire updated successfully' });
    return response.data.data!;
  },

  deleteUmpire: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-umpires/${id}`);
    toaster.success({ title: 'Umpire deleted successfully' });
  },

  // Scoring Device management
  getScoringDevices: async (
    tournamentId: string
  ): Promise<TournamentScoringDevice[]> => {
    const response = await api.get<ApiResponse<TournamentScoringDevice[]>>(
      `/tournaments/${tournamentId}/scoring-devices`
    );
    return response.data.data || [];
  },

  addScoringDevice: async (
    tournamentId: string,
    data: {
      name: string;
      deviceType?: string;
      deviceId?: string;
      notes?: string;
    }
  ): Promise<TournamentScoringDevice> => {
    const response = await api.post<ApiResponse<TournamentScoringDevice>>(
      `/tournaments/${tournamentId}/scoring-devices`,
      data
    );
    toaster.success({ title: 'Scoring device added successfully' });
    return response.data.data!;
  },

  updateScoringDevice: async (
    id: string,
    data: Partial<TournamentScoringDevice>
  ): Promise<TournamentScoringDevice> => {
    const response = await api.put<ApiResponse<TournamentScoringDevice>>(
      `/tournament-scoring-devices/${id}`,
      data
    );
    toaster.success({ title: 'Scoring device updated successfully' });
    return response.data.data!;
  },

  deleteScoringDevice: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-scoring-devices/${id}`);
    toaster.success({ title: 'Scoring device deleted successfully' });
  },

  // Court management
  getCourts: async (tournamentId: string): Promise<TournamentCourt[]> => {
    const response = await api.get<ApiResponse<TournamentCourt[]>>(
      `/tournaments/${tournamentId}/courts`
    );
    return response.data.data || [];
  },

  addCourt: async (
    tournamentId: string,
    data: {
      courtNumber: number;
      courtName?: string;
      notes?: string;
    }
  ): Promise<TournamentCourt> => {
    const response = await api.post<ApiResponse<TournamentCourt>>(
      `/tournaments/${tournamentId}/courts`,
      data
    );
    toaster.success({ title: 'Court added successfully' });
    return response.data.data!;
  },

  updateCourt: async (
    id: string,
    data: Partial<TournamentCourt>
  ): Promise<TournamentCourt> => {
    const response = await api.put<ApiResponse<TournamentCourt>>(
      `/tournament-courts/${id}`,
      data
    );
    toaster.success({ title: 'Court updated successfully' });
    return response.data.data!;
  },

  deleteCourt: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-courts/${id}`);
    toaster.success({ title: 'Court deleted successfully' });
  },

  // All matches across categories
  getAllMatches: async (tournamentId: string): Promise<CategoryMatch[]> => {
    const response = await api.get<ApiResponse<CategoryMatch[]>>(
      `/tournaments/${tournamentId}/all-matches`
    );
    return response.data.data || [];
  },

  // Update schedule type
  updateScheduleType: async (
    tournamentId: string,
    scheduleType: ScheduleType
  ): Promise<Tournament> => {
    const response = await api.put<ApiResponse<Tournament>>(
      `/tournaments/${tournamentId}`,
      { scheduleType }
    );
    return response.data.data!;
  },

  // Tournament venue management
  getVenues: async (tournamentId: string): Promise<TournamentVenue[]> => {
    const response = await api.get<ApiResponse<TournamentVenue[]>>(
      `/tournaments/${tournamentId}/venues`
    );
    return response.data.data || [];
  },

  addVenue: async (
    tournamentId: string,
    data: {
      venueId: string;
      courts?: { courtNumber: number; courtName?: string }[];
    }
  ): Promise<TournamentVenue> => {
    const response = await api.post<ApiResponse<TournamentVenue>>(
      `/tournaments/${tournamentId}/venues`,
      data
    );
    return response.data.data!;
  },

  removeVenue: async (tournamentId: string, venueId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/tournaments/${tournamentId}/venues/${venueId}`
    );
  },
};
