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
}
