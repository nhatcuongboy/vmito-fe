export interface SessionSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onCreateClick?: () => void;
}
