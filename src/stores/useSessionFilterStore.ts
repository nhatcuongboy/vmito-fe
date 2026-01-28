import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Time range definitions
const TIME_RANGES = [
  { key: 'morning', start: 5, end: 12 },
  { key: 'afternoon', start: 12, end: 18 },
  { key: 'evening', start: 18, end: 22 },
  { key: 'night', start: 22, end: 5 },
] as const;

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

export interface SessionFilters {
  date: string;
  searchQuery: string;
  cities: string[]; // Changed to array for multi-select
  districts: string[]; // Changed to array for multi-select
  levels: number[];
  timeRanges: TimeRangeKey[];
  minFee: number;
  maxFee: number;
  hasSlots: boolean;
  minAvailableSlots: number;
  splitEvenly: boolean; // New field for split payment option
}

interface SessionFilterState {
  // State
  filters: SessionFilters;
  sortByDistance: boolean;
  userLocation: { lat: number; lng: number } | null;
  isHydrated: boolean;

  // Actions
  setFilter: <K extends keyof SessionFilters>(key: K, value: SessionFilters[K]) => void;
  setFilters: (filters: Partial<SessionFilters>) => void;
  clearFilters: () => void;
  setSortByDistance: (sort: boolean) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setHydrated: (hydrated: boolean) => void;

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
    persist(
      (set) => ({
        // Initial state
        filters: defaultFilters,
        sortByDistance: false,
        userLocation: null,
        isHydrated: false,

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
            },
            false,
            'clearFilters'
          ),

        setSortByDistance: (sort) =>
          set({ sortByDistance: sort }, false, 'setSortByDistance'),

        setUserLocation: (location) =>
          set({ userLocation: location }, false, 'setUserLocation'),

        setHydrated: (hydrated) =>
          set({ isHydrated: hydrated }, false, 'setHydrated'),

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
      {
        name: 'session-filter-storage',
        // Persist filters but not location state
        partialize: (state) => ({
          filters: state.filters,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true);
        },
      }
    ),
    { name: 'session-filter-store' }
  )
);

// Helper hook to wait for hydration
export const useFilterHydration = () => {
  const isHydrated = useSessionFilterStore((state) => state.isHydrated);
  return isHydrated;
};
