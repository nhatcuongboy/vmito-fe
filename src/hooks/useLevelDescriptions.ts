'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { VALID_LEVELS } from '@/constants/levels';
import { LevelDescriptionService } from '@/lib/api/level-description.service';
import { LevelDescription } from '@/lib/api/types';

let cachedDescriptions: LevelDescription[] | null = null;
let pendingRequest: Promise<LevelDescription[]> | null = null;

const emptyDescriptions = (): LevelDescription[] =>
  VALID_LEVELS.map((level) => ({ level, description: '' }));

const descriptionsToMap = (descriptions: LevelDescription[]) =>
  new Map(descriptions.map((item) => [item.level, item.description || '']));

export const setLevelDescriptionsCache = (descriptions: LevelDescription[]) => {
  cachedDescriptions = descriptions;
};

export function useLevelDescriptions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [descriptions, setDescriptions] = useState<LevelDescription[]>(
    () => cachedDescriptions || emptyDescriptions()
  );
  const [isLoading, setIsLoading] = useState(
    enabled && cachedDescriptions === null
  );
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (cachedDescriptions) {
      setDescriptions(cachedDescriptions);
      setIsLoading(false);
      return cachedDescriptions;
    }

    if (!pendingRequest) {
      pendingRequest = LevelDescriptionService.getLevelDescriptions().finally(
        () => {
          pendingRequest = null;
        }
      );
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await pendingRequest;
      cachedDescriptions = result;
      setDescriptions(result);
      return result;
    } catch (err) {
      const normalizedError =
        err instanceof Error ? err : new Error('Failed to load descriptions');
      setError(normalizedError);
      return cachedDescriptions || emptyDescriptions();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    cachedDescriptions = null;
    pendingRequest = null;
    return load();
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  const descriptionMap = useMemo(
    () => descriptionsToMap(descriptions),
    [descriptions]
  );

  return {
    descriptions,
    descriptionMap,
    isLoading,
    error,
    reload: refresh,
  };
}
