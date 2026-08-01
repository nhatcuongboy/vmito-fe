import { api, ApiResponse } from './base';

export const FeatureFlagsService = {
  getAll: async (): Promise<Record<string, boolean>> => {
    const response =
      await api.get<ApiResponse<Record<string, boolean>>>('/feature-flags');
    return response.data.data || {};
  },
};
