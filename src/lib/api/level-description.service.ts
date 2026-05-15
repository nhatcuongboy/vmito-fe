import { api } from './base';
import { ApiResponse, LevelDescription } from './types';
import { VALID_LEVELS } from '@/constants/levels';

export interface UpdateLevelDescriptionsRequest {
  descriptions: Array<{
    level: number;
    description: string;
  }>;
}

const normalizeLevelDescriptions = (
  descriptions: LevelDescription[] = []
): LevelDescription[] => {
  const byLevel = new Map(
    descriptions.map((item) => [
      Number(item.level),
      {
        ...item,
        level: Number(item.level),
        description: item.description || '',
      },
    ])
  );

  return VALID_LEVELS.map((level) => {
    const existing = byLevel.get(level);
    return {
      level,
      description: existing?.description || '',
      updatedAt: existing?.updatedAt,
    };
  });
};

export const LevelDescriptionService = {
  getLevelDescriptions: async (): Promise<LevelDescription[]> => {
    const response = await api.get<ApiResponse<LevelDescription[]>>(
      '/level-descriptions'
    );
    return normalizeLevelDescriptions(response.data.data || []);
  },

  updateLevelDescriptions: async (
    data: UpdateLevelDescriptionsRequest
  ): Promise<LevelDescription[]> => {
    const response = await api.put<ApiResponse<LevelDescription[]>>(
      '/admin/level-descriptions',
      {
        descriptions: normalizeLevelDescriptions(data.descriptions).map(
          ({ level, description }) => ({
            level,
            description: description.trim(),
          })
        ),
      }
    );

    return normalizeLevelDescriptions(response.data.data || []);
  },
};
