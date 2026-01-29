'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRatingStats } from '@/lib/api/types';
import { RatingService } from '@/lib/api/rating.service';

interface RatingStatsContextType {
  getRatingStats: (userId: string) => UserRatingStats | null;
  isLoading: boolean;
}

const RatingStatsContext = createContext<RatingStatsContextType | undefined>(undefined);

interface RatingStatsProviderProps {
  children: React.ReactNode;
  userIds: string[];
}

export const RatingStatsProvider: React.FC<RatingStatsProviderProps> = ({ children, userIds }) => {
  const [statsMap, setStatsMap] = useState<Map<string, UserRatingStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatchStats = async () => {
      if (!userIds || userIds.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const stats = await RatingService.getBatchUserRatingStats(userIds);
        
        const newMap = new Map<string, UserRatingStats>();
        stats.forEach((stat) => {
          newMap.set(stat.userId, stat);
        });
        
        setStatsMap(newMap);
      } catch (error) {
        console.error('Failed to fetch batch rating stats:', error);
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

  return (
    <RatingStatsContext.Provider value={{ getRatingStats, isLoading }}>
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
