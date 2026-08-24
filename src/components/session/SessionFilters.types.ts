import React from 'react';

export interface ISessionFilterState {
  listStatus?: 'active' | 'ended' | 'all';
  status?: string;
  date?: string;
  level?: number;
  levels?: number[];
  timeRanges?: string[];
  minFee?: number;
  maxFee?: number;
  splitEvenly?: boolean;
  searchQuery?: string;
}

export interface ISessionFiltersProps {
  onFilterChange: (filters: ISessionFilterState) => void;
  showLevelFilter?: boolean;
  showDateFilter?: boolean;
  showSearchFilter?: boolean;
  showStatusFilter?: boolean;
  showListStatusFilter?: boolean;
  showTimeFilter?: boolean;
  showFeeFilter?: boolean;
  initialFilters?: ISessionFilterState;
  resultCount?: number;
  onCreateClick?: () => void;
  topAddon?: React.ReactNode;
  hideCreateOnMobile?: boolean;
  /** When true, hide the sticky search bar on desktop (shown in top bar instead) */
  hideSearchOnDesktop?: boolean;
  /** Keep the search controls pinned below the top bar while scrolling. */
  stickySearch?: boolean;
  /** Use the warm page canvas behind the search controls on mobile. */
  usePageCanvasOnMobile?: boolean;
}
