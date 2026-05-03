import React from 'react';

export interface ISessionFilterState {
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
  showTimeFilter?: boolean;
  showFeeFilter?: boolean;
  initialFilters?: ISessionFilterState;
  resultCount?: number;
  onCreateClick?: () => void;
  topAddon?: React.ReactNode;
  hideCreateOnMobile?: boolean;
}
