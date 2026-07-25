'use client';

import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

/**
 * Touch-only pull-to-refresh wrapper: pulling down while the page is
 * scrolled to the top shows a spinner indicator and triggers `onRefresh`
 * once the pull passes the threshold. No effect with mouse/desktop.
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const t = useTranslations('posts');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0 || isRefreshing) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null || isRefreshing) return;
    if (window.scrollY > 0) {
      startYRef.current = null;
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    // Dampen the pull so it feels elastic.
    setPullDistance(Math.min(delta * 0.5, MAX_PULL));
  };

  const handleTouchEnd = async () => {
    const distance = pullDistance;
    startYRef.current = null;

    if (distance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.7);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const showIndicator = pullDistance > 0 || isRefreshing;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        aria-hidden={!showIndicator}
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: showIndicator ? Math.max(pullDistance, 44) : 0 }}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <RefreshCcw
            size={18}
            className={isRefreshing ? 'animate-spin' : ''}
            style={
              isRefreshing
                ? undefined
                : {
                    transform: `rotate(${progress * 270}deg)`,
                    opacity: 0.4 + progress * 0.6,
                  }
            }
          />
          <span>{isRefreshing ? t('refreshing') : t('pullToRefresh')}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
