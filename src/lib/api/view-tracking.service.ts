import { api, ApiResponse } from './base';

export type ViewTargetType = 'VENUE' | 'CLUB' | 'SESSION';

interface IViewCountResponse {
  count: number;
}

interface ITrackViewResponse {
  count?: number;
}

export const ViewTrackingService = {
  trackView: async (
    targetType: ViewTargetType,
    targetId: string
  ): Promise<ITrackViewResponse> => {
    const response = await api.post<ApiResponse<ITrackViewResponse>>(
      '/views/track',
      { targetType, targetId },
      { skipGlobalError: true }
    );
    return response.data.data || {};
  },

  getViewCount: async (
    targetType: ViewTargetType,
    targetId: string
  ): Promise<number> => {
    const response = await api.get<ApiResponse<IViewCountResponse>>(
      '/views/count',
      {
        params: { targetType, targetId },
        skipGlobalError: true,
      }
    );
    return response.data.data?.count ?? 0;
  },
};
