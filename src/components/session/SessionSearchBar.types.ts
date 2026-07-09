import React from 'react';

export interface SessionSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onCreateClick?: () => void;
  isLoadingCreate?: boolean;
  topAddon?: React.ReactNode;
  hideCreateOnMobile?: boolean;
  topOffset?: number;
  /** When true, use position:fixed on mobile instead of sticky (for discovery pages) */
  fixedOnMobile?: boolean;
  /** When true, hide the sticky search bar on desktop (shown in top bar instead) */
  hideOnDesktop?: boolean;
  /** When true, show the city selector inside the search bar on mobile */
  showCitySelector?: boolean;
}
