import { api, ApiResponse } from './base';
import {
  IGenerateScheduleRequest,
  IGenerateScheduleResponse,
  ISchedulePreviewResponse,
  IUpdateMatchAssignment,
  ISaveScheduleResponse,
  IValidateScheduleResponse,
  IScheduleConflict,
  ICourtAvailability,
  IQueuedMatch,
  IAutoAssignResult,
  IInitializeQueueResponse,
} from './types';

export const ScheduleGeneratorService = {
  getReadiness: async (
    tournamentId: string
  ): Promise<{
    totalMatches: number;
    schedulableMatches: number;
    scheduledMatches: number;
    unscheduledMatches: number;
    inProgressMatches: number;
    finishedMatches: number;
    categoriesWithoutMatches: Array<{
      categoryId: string;
      categoryName: string;
    }>;
    canGenerateSchedule: boolean;
    blockingReason?: 'MATCHES_NOT_GENERATED' | 'NO_SCHEDULABLE_MATCHES';
  }> => {
    const response = await api.get<
      ApiResponse<{
        totalMatches: number;
        schedulableMatches: number;
        scheduledMatches: number;
        unscheduledMatches: number;
        inProgressMatches: number;
        finishedMatches: number;
        categoriesWithoutMatches: Array<{
          categoryId: string;
          categoryName: string;
        }>;
        canGenerateSchedule: boolean;
        blockingReason?: 'MATCHES_NOT_GENERATED' | 'NO_SCHEDULABLE_MATCHES';
      }>
    >(`/tournaments/${tournamentId}/schedule/readiness`);
    return response.data.data!;
  },

  generate: async (
    tournamentId: string,
    data: IGenerateScheduleRequest
  ): Promise<IGenerateScheduleResponse> => {
    const response = await api.post<ApiResponse<IGenerateScheduleResponse>>(
      `/tournaments/${tournamentId}/schedule/generate`,
      data
    );
    return response.data.data!;
  },

  getPreview: async (
    tournamentId: string,
    scheduleId: string
  ): Promise<ISchedulePreviewResponse> => {
    const response = await api.get<ApiResponse<ISchedulePreviewResponse>>(
      `/tournaments/${tournamentId}/schedule/${scheduleId}/preview`
    );
    return response.data.data!;
  },

  updateMatchAssignment: async (
    tournamentId: string,
    scheduleId: string,
    matchId: string,
    data: IUpdateMatchAssignment
  ): Promise<{ success: boolean; conflicts?: IScheduleConflict[] }> => {
    const response = await api.put<
      ApiResponse<{ success: boolean; conflicts?: IScheduleConflict[] }>
    >(
      `/tournaments/${tournamentId}/schedule/${scheduleId}/matches/${matchId}`,
      data
    );
    return response.data.data!;
  },

  saveSchedule: async (
    tournamentId: string,
    scheduleId: string
  ): Promise<ISaveScheduleResponse> => {
    const response = await api.post<ApiResponse<ISaveScheduleResponse>>(
      `/tournaments/${tournamentId}/schedule/${scheduleId}/save`
    );
    return response.data.data!;
  },

  validateConfig: async (
    tournamentId: string,
    data: IGenerateScheduleRequest
  ): Promise<IValidateScheduleResponse> => {
    const response = await api.post<ApiResponse<IValidateScheduleResponse>>(
      `/tournaments/${tournamentId}/schedule/validate`,
      data
    );
    return response.data.data!;
  },
};

// ===== Next Available Court mode (live queue) =====
export const ScheduleQueueService = {
  getAvailableCourts: async (
    tournamentId: string
  ): Promise<ICourtAvailability[]> => {
    const response = await api.get<ApiResponse<ICourtAvailability[]>>(
      `/tournaments/${tournamentId}/schedule/courts/available`
    );
    return response.data.data!;
  },

  getQueue: async (tournamentId: string): Promise<IQueuedMatch[]> => {
    const response = await api.get<ApiResponse<IQueuedMatch[]>>(
      `/tournaments/${tournamentId}/schedule/queue`
    );
    return response.data.data!;
  },

  getAddableMatches: async (tournamentId: string): Promise<IQueuedMatch[]> => {
    const response = await api.get<ApiResponse<IQueuedMatch[]>>(
      `/tournaments/${tournamentId}/schedule/queue/addable`
    );
    return response.data.data!;
  },

  unassignMatch: async (
    tournamentId: string,
    matchId: string
  ): Promise<{ success: boolean }> => {
    const response = await api.post<ApiResponse<{ success: boolean }>>(
      `/tournaments/${tournamentId}/schedule/matches/${matchId}/unassign`
    );
    return response.data.data!;
  },

  initializeQueue: async (
    tournamentId: string
  ): Promise<IInitializeQueueResponse> => {
    const response = await api.post<ApiResponse<IInitializeQueueResponse>>(
      `/tournaments/${tournamentId}/schedule/queue/initialize`
    );
    return response.data.data!;
  },

  addToQueue: async (
    tournamentId: string,
    matchId: string,
    queueOrder?: number
  ): Promise<{ success: boolean }> => {
    const response = await api.post<ApiResponse<{ success: boolean }>>(
      `/tournaments/${tournamentId}/schedule/queue/add`,
      { matchId, queueOrder }
    );
    return response.data.data!;
  },

  reorderQueue: async (
    tournamentId: string,
    matchIds: string[]
  ): Promise<{ success: boolean }> => {
    const response = await api.put<ApiResponse<{ success: boolean }>>(
      `/tournaments/${tournamentId}/schedule/queue/reorder`,
      { matchIds }
    );
    return response.data.data!;
  },

  removeFromQueue: async (
    tournamentId: string,
    matchId: string
  ): Promise<{ success: boolean }> => {
    const response = await api.delete<ApiResponse<{ success: boolean }>>(
      `/tournaments/${tournamentId}/schedule/queue/${matchId}`
    );
    return response.data.data!;
  },

  autoAssignNext: async (tournamentId: string): Promise<IAutoAssignResult> => {
    const response = await api.post<ApiResponse<IAutoAssignResult>>(
      `/tournaments/${tournamentId}/schedule/auto-assign`
    );
    return response.data.data!;
  },
};
