'use client';

import { useEffect, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  ViewTargetType,
  ViewTrackingService,
} from '@/lib/api/view-tracking.service';

interface DetailViewCountFooterProps {
  targetType: ViewTargetType;
  targetId: string;
  initialCount?: number;
}

const getLocalDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getHasViewedToday = (storageKey: string) => {
  try {
    return window.localStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
};

const setHasViewedToday = (storageKey: string) => {
  try {
    window.localStorage.setItem(storageKey, '1');
  } catch {
    // Ignore storage failures; view count should never block the page.
  }
};

export default function DetailViewCountFooter({
  targetType,
  targetId,
  initialCount,
}: DetailViewCountFooterProps) {
  const t = useTranslations('common');
  const [viewCount, setViewCount] = useState<number | null>(
    typeof initialCount === 'number' ? initialCount : null
  );

  useEffect(() => {
    if (!targetId) return;

    let isActive = true;
    const storageKey = `vmito_viewed:${targetType}:${targetId}:${getLocalDateKey()}`;

    const syncViewCount = async () => {
      try {
        let trackedCount: number | undefined;
        const hasViewedToday = getHasViewedToday(storageKey);

        if (!hasViewedToday) {
          const trackResult = await ViewTrackingService.trackView(
            targetType,
            targetId
          );
          trackedCount = trackResult.count;
          setHasViewedToday(storageKey);
        }

        let latestCount = trackedCount;
        try {
          latestCount = await ViewTrackingService.getViewCount(
            targetType,
            targetId
          );
        } catch {
          if (typeof latestCount !== 'number') throw new Error('count failed');
        }

        if (isActive) {
          setViewCount(latestCount);
        }
      } catch {
        if (isActive && typeof initialCount !== 'number') {
          setViewCount(null);
        }
      }
    };

    syncViewCount();

    return () => {
      isActive = false;
    };
  }, [initialCount, targetId, targetType]);

  if (typeof viewCount !== 'number') return null;

  return (
    <Text fontSize="xs" color="gray.500" textAlign="center">
      {t('viewCount', { count: viewCount })}
    </Text>
  );
}
