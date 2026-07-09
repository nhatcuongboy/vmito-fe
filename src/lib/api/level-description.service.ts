import { api } from './base';
import { ApiResponse, LevelDefinition, LevelDescription } from './types';
import { LEVEL_DEFINITIONS, VALID_LEVELS } from '@/constants/levels';

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
  getLevelDefinitions: async (): Promise<LevelDefinition[]> => {
    const response =
      await api.get<ApiResponse<LevelDefinition[]>>('/level-definitions');
    const definitions = response.data.data || [];

    if (definitions.length > 0) {
      return definitions
        .filter((level) => level.active)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return LEVEL_DEFINITIONS.map((level) => ({
      id: level.id,
      code: level.code,
      shortLabel: level.shortLabel,
      sortOrder: level.sortOrder,
      active: true,
    }));
  },

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
