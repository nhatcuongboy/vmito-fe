export interface ResponsiveColumnCounts {
  base: number;
  md: number;
  lg: number;
}

export type ResponsiveGridDisplay = {
  base: 'grid' | 'none';
  md: 'grid' | 'none';
  lg: 'grid' | 'none';
};

/**
 * Card skeletons are useful when the current card row is complete. When it is
 * partial, a new full skeleton row creates a visually disconnected gap, so the
 * compact loading status is shown on its own instead.
 */
export function getFullRowSkeletonDisplay(
  itemCount: number,
  columns: ResponsiveColumnCounts
): ResponsiveGridDisplay {
  const displayAt = (columnCount: number) =>
    itemCount % columnCount === 0 ? 'grid' : 'none';

  return {
    base: displayAt(columns.base),
    md: displayAt(columns.md),
    lg: displayAt(columns.lg),
  };
}
