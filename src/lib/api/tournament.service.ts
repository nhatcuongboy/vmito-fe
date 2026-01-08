import toast from 'react-hot-toast';
import { api, ApiResponse } from './base';
import {
  Tournament,
  CreateTournamentRequest,
  TournamentUmpire,
  TournamentScoringDevice,
  TournamentCourt,
} from './types';

export const TournamentService = {
  // Get all tournaments
  getAllTournaments: async (): Promise<Tournament[]> => {
    const response = await api.get<ApiResponse<Tournament[]>>('/tournaments');
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
    toast.success('Tournament created successfully');
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
    toast.success('Tournament updated successfully');
    return response.data.data!;
  },

  // Delete tournament
  deleteTournament: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournaments/${id}`);
    toast.success('Tournament deleted successfully');
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
    toast.success('Umpire added successfully');
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
    toast.success('Umpire updated successfully');
    return response.data.data!;
  },

  deleteUmpire: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-umpires/${id}`);
    toast.success('Umpire deleted successfully');
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
    toast.success('Scoring device added successfully');
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
    toast.success('Scoring device updated successfully');
    return response.data.data!;
  },

  deleteScoringDevice: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-scoring-devices/${id}`);
    toast.success('Scoring device deleted successfully');
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
    toast.success('Court added successfully');
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
    toast.success('Court updated successfully');
    return response.data.data!;
  },

  deleteCourt: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/tournament-courts/${id}`);
    toast.success('Court deleted successfully');
  },
};
