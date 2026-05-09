import { api, ApiResponse } from './base';
import {
  IGenerateScheduleRequest,
  IGenerateScheduleResponse,
  ISchedulePreviewResponse,
  IUpdateMatchAssignment,
  ISaveScheduleResponse,
  IValidateScheduleResponse,
  IScheduleConflict,
} from './types';

export const ScheduleGeneratorService = {
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
