import { SessionFilters } from '@/stores/useSessionFilterStore';

export type SessionFilterState = SessionFilters;

export interface SessionFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SessionFilters;
  setFilters: (filters: SessionFilters) => void;
  sortByDistance: boolean;
  setSortByDistance: (value: boolean) => void;
  onSubmit: () => void;
  onReset: () => void;
  activeFilterCount: number;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
}
