import React from 'react';

export interface ISessionFilterState {
  status?: string;
  date?: string;
  level?: number;
  searchQuery?: string;
}

export interface ISessionFiltersProps {
  onFilterChange: (filters: ISessionFilterState) => void;
  showLevelFilter?: boolean;
  showDateFilter?: boolean;
  showSearchFilter?: boolean;
  showStatusFilter?: boolean;
  initialFilters?: ISessionFilterState;
  resultCount?: number;
  onCreateClick?: () => void;
  topAddon?: React.ReactNode;
}
