import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TIME_RANGES } from '@/constants';

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

export interface SessionFilters {
  date: string;
  searchQuery: string;
  cities: string[]; // Changed to array for multi-select
  districts: string[]; // Changed to array for multi-select
  venueId: string;
  levels: number[];
  timeRanges: TimeRangeKey[];
  minFee: number;
  maxFee: number;
  hasSlots: boolean;
  minAvailableSlots: number;
  splitEvenly: boolean; // New field for split payment option
}

export type ViewMode = 'full' | 'compact' | 'map';

export type SessionSortBy =
  | 'date_desc'
  | 'date_asc'
  | 'price_asc'
  | 'price_desc'
  | 'distance'
  | 'slots_desc'
  | 'created_desc'
  | 'created_asc'
  | 'status';

/** Convert frontend SessionSortBy to backend API sortBy/sortOrder params */
export function toApiSort(sortBy: SessionSortBy): {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} {
  switch (sortBy) {
    case 'date_asc':
      return { sortBy: 'date', sortOrder: 'asc' };
    case 'date_desc':
      return { sortBy: 'date', sortOrder: 'desc' };
    case 'price_asc':
      return { sortBy: 'price', sortOrder: 'asc' };
    case 'price_desc':
      return { sortBy: 'price', sortOrder: 'desc' };
    case 'created_asc':
      return { sortBy: 'created', sortOrder: 'asc' };
    case 'created_desc':
      return { sortBy: 'created', sortOrder: 'desc' };
    case 'status':
      return { sortBy: 'status', sortOrder: 'asc' };
    case 'distance':
    case 'slots_desc':
      // These are handled client-side or via special API params
      return {};
    default:
      return {};
  }
}

interface SessionFilterState {
  // State
  filters: SessionFilters;
  sortByDistance: boolean;
  sortBy: SessionSortBy;
  userLocation: { lat: number; lng: number } | null;
  viewMode: ViewMode;

  // Actions
  setFilter: <K extends keyof SessionFilters>(
    key: K,
    value: SessionFilters[K]
  ) => void;
  setFilters: (filters: Partial<SessionFilters>) => void;
  clearFilters: () => void;
  setSortByDistance: (sort: boolean) => void;
  setSortBy: (sort: SessionSortBy) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setViewMode: (mode: ViewMode) => void;

  // Multi-select helpers
  toggleCity: (city: string) => void;
  toggleDistrict: (district: string) => void;
  clearLocation: () => void;
}

const defaultFilters: SessionFilters = {
  date: '',
  searchQuery: '',
  cities: [],
  districts: [],
  venueId: '',
  levels: [],
  timeRanges: [],
  minFee: 0,
  maxFee: 200000,
  hasSlots: false,
  minAvailableSlots: 0,
  splitEvenly: false,
};

export const useSessionFilterStore = create<SessionFilterState>()(
  devtools(
    (set) => ({
      // Initial state
      filters: defaultFilters,
      sortByDistance: false,
      sortBy: 'date_asc' as SessionSortBy,
      userLocation: null,
      viewMode: 'full' as ViewMode,

      // Actions
      setFilter: (key, value) =>
        set(
          (state) => ({
            filters: { ...state.filters, [key]: value },
          }),
          false,
          `setFilter:${key}`
        ),

      setFilters: (newFilters) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...newFilters },
          }),
          false,
          'setFilters'
        ),

      clearFilters: () =>
        set(
          {
            filters: defaultFilters,
            sortByDistance: false,
            sortBy: 'date_asc' as SessionSortBy,
          },
          false,
          'clearFilters'
        ),

      setSortByDistance: (sort) =>
        set({ sortByDistance: sort }, false, 'setSortByDistance'),

      setSortBy: (sort) =>
        set(
          {
            sortBy: sort,
            sortByDistance: sort === 'distance',
          },
          false,
          'setSortBy'
        ),

      setUserLocation: (location) =>
        set({ userLocation: location }, false, 'setUserLocation'),

      setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),

      // Multi-select helpers
      toggleCity: (city) =>
        set(
          (state) => {
            const cities = state.filters.cities.includes(city)
              ? state.filters.cities.filter((c) => c !== city)
              : [...state.filters.cities, city];

            // Clear districts when toggling cities
            return {
              filters: {
                ...state.filters,
                cities,
                districts: [],
              },
            };
          },
          false,
          'toggleCity'
        ),

      toggleDistrict: (district) =>
        set(
          (state) => {
            const districts = state.filters.districts.includes(district)
              ? state.filters.districts.filter((d) => d !== district)
              : [...state.filters.districts, district];

            return {
              filters: { ...state.filters, districts },
            };
          },
          false,
          'toggleDistrict'
        ),

      clearLocation: () =>
        set(
          (state) => ({
            filters: {
              ...state.filters,
              cities: [],
              districts: [],
            },
          }),
          false,
          'clearLocation'
        ),
    }),
    { name: 'session-filter-store' }
  )
);
