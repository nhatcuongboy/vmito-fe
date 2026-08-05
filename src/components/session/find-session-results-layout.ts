import type { ViewMode } from '@/lib/view-mode';
import type { ResponsiveColumnCounts } from '@/components/common/infinite-loading-layout';

export type SessionResultsViewMode = Exclude<ViewMode, 'map'>;

type ResponsiveDisplay = {
  base: 'flex' | 'none';
  md: 'flex' | 'none';
  lg: 'flex' | 'none';
};

interface SessionResultsLayout {
  columnCounts: ResponsiveColumnCounts;
  templateColumns: {
    base: string;
    md: string;
    lg: string;
  };
  gap: { base: number; md: number } | number;
  loadMoreSkeletonDisplays: ResponsiveDisplay[];
}

/**
 * Keeps real-card and load-more skeleton layouts in sync at every breakpoint.
 * Skeletons are rendered in a separate grid, so these displays always form a
 * complete new row instead of occupying remaining cells beside real cards.
 */
export const SESSION_RESULTS_LAYOUT: Record<
  SessionResultsViewMode,
  SessionResultsLayout
> = {
  list: {
    columnCounts: { base: 1, md: 3, lg: 4 },
    templateColumns: {
      base: 'minmax(0, 1fr)',
      md: 'repeat(3, minmax(0, 1fr))',
      lg: 'repeat(4, minmax(0, 1fr))',
    },
    gap: { base: 2, md: 3 },
    loadMoreSkeletonDisplays: [
      { base: 'flex', md: 'flex', lg: 'flex' },
      { base: 'none', md: 'flex', lg: 'flex' },
      { base: 'none', md: 'flex', lg: 'flex' },
      { base: 'none', md: 'none', lg: 'flex' },
    ],
  },
  grid: {
    columnCounts: { base: 1, md: 2, lg: 3 },
    templateColumns: {
      base: 'minmax(0, 1fr)',
      md: 'repeat(2, 1fr)',
      lg: 'repeat(3, 1fr)',
    },
    gap: 6,
    loadMoreSkeletonDisplays: [
      { base: 'flex', md: 'flex', lg: 'flex' },
      { base: 'none', md: 'flex', lg: 'flex' },
      { base: 'none', md: 'none', lg: 'flex' },
    ],
  },
};
