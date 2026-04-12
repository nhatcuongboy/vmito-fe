'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { UserRatingStats } from '@/lib/api/types';
import { RatingService } from '@/lib/api/rating.service';

interface RatingStatsContextType {
  getRatingStats: (userId: string) => UserRatingStats | null;
  isLoading: boolean;
}

const RatingStatsContext = createContext<RatingStatsContextType | undefined>(
  undefined
);

interface RatingStatsProviderProps {
  children: React.ReactNode;
  userIds: string[];
}

export const RatingStatsProvider: React.FC<RatingStatsProviderProps> = ({
  children,
  userIds,
}) => {
  const [statsMap, setStatsMap] = useState<Map<string, UserRatingStats>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Track which IDs we've already fetched or requested to avoid redundant calls
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchBatchStats = async () => {
      if (!userIds || userIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Only fetch the IDs we haven't tracked yet
      const missingIds = userIds.filter((id) => !fetchedIdsRef.current.has(id));

      if (missingIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Optimistically mark requested IDs to avoid race conditions
      missingIds.forEach((id) => fetchedIdsRef.current.add(id));

      try {
        setIsLoading(true);
        const stats = await RatingService.getBatchUserRatingStats(missingIds);

        setStatsMap((prevMap) => {
          const newMap = new Map(prevMap);
          stats.forEach((stat) => {
            newMap.set(stat.userId, stat);
          });
          return newMap;
        });
      } catch (error) {
        console.error('Failed to fetch batch rating stats:', error);
        // Rollback tracking so we can try again later
        missingIds.forEach((id) => fetchedIdsRef.current.delete(id));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatchStats();
  }, [userIds.join(',')]);

  const getRatingStats = useCallback(
    (userId: string) => {
      return statsMap.get(userId) || null;
    },
    [statsMap]
  );

  const contextValue = useMemo(
    () => ({ getRatingStats, isLoading }),
    [getRatingStats, isLoading]
  );

  return (
    <RatingStatsContext.Provider value={contextValue}>
      {children}
    </RatingStatsContext.Provider>
  );
};

export const useRatingStats = () => {
  const context = useContext(RatingStatsContext);
  if (context === undefined) {
    // Return safe default when used outside provider
    return {
      getRatingStats: () => null,
      isLoading: false,
    };
  }
  return context;
};
