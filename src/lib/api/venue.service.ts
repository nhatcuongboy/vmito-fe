import { api, ApiResponse } from './base';
import {
  CalculateVenueRentalPriceRequest,
  CreateVenuePriceBookRequest,
  CreateVenuePriceRuleRequest,
  SearchVenueResponse,
  UpdateVenuePriceBookRequest,
  UpdateVenuePriceRuleRequest,
  Venue,
  VenuePriceBook,
  VenuePriceRule,
  VenueRentalPriceCalculation,
} from './types';

/** Mirrors MigrateAddressesResult in vmito-be venue-address-migration.service.ts. */
export interface MigrateAddressesResult {
  message: string;
  dryRun: boolean;
  rescan: boolean;
  total: number;
  matched: number;
  cityOnly: number;
  streetOnly: number;
  needsReview: number;
  needsReviewSamples: {
    id: string;
    name: string;
    address: string;
    district: string;
    city: string;
  }[];
}

export interface BackfillResult {
  message: string;
  count: number;
}

export const VenueService = {
  // Search venues (public - no auth required)
  searchVenues: async (filters?: {
    keyword?: string;
    city?: string;
    district?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    status?: string;
    isVerified?: boolean;
    hasNewAddress?: boolean;
    favoriteOnly?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchVenueResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<ApiResponse<SearchVenueResponse>>(
      `/venues/search?${params.toString()}`
    );
    return response.data.data!;
  },

  // Get all venues
  getAllVenues: async (): Promise<Venue[]> => {
    const response = await api.get<ApiResponse<SearchVenueResponse>>(
      '/venues',
      {
        params: { limit: 100 },
      }
    );
    return response.data.data?.data || [];
  },

  // Get venue by ID
  getVenue: async (id: string): Promise<Venue> => {
    const response = await api.get<ApiResponse<Venue>>(`/venues/${id}`);
    return response.data.data!;
  },

  // Create new venue
  createVenue: async (venue: Omit<Venue, 'id'>): Promise<Venue> => {
    const response = await api.post<ApiResponse<Venue>>('/venues', venue);
    return response.data.data!;
  },

  // Create multiple venues
  createBulkVenues: async (
    venues: Omit<Venue, 'id'>[]
  ): Promise<{ count: number; message: string }> => {
    const response = await api.post<
      ApiResponse<{ count: number; message: string }>
    >('/venues/bulk', { venues });
    return response.data.data!;
  },

  // Update venue
  updateVenue: async (id: string, venue: Partial<Venue>): Promise<Venue> => {
    const response = await api.patch<ApiResponse<Venue>>(
      `/venues/${id}`,
      venue
    );
    return response.data.data!;
  },

  // Delete venue
  deleteVenue: async (id: string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/venues/${id}`);
  },

  getPriceBooks: async (venueId: string): Promise<VenuePriceBook[]> => {
    const response = await api.get<ApiResponse<VenuePriceBook[]>>(
      `/venues/${venueId}/price-books`
    );
    return response.data.data || [];
  },

  createPriceBook: async (
    venueId: string,
    data: CreateVenuePriceBookRequest
  ): Promise<VenuePriceBook> => {
    const response = await api.post<ApiResponse<VenuePriceBook>>(
      `/venues/${venueId}/price-books`,
      data
    );
    return response.data.data!;
  },

  updatePriceBook: async (
    venueId: string,
    priceBookId: string,
    data: UpdateVenuePriceBookRequest
  ): Promise<VenuePriceBook> => {
    const response = await api.patch<ApiResponse<VenuePriceBook>>(
      `/venues/${venueId}/price-books/${priceBookId}`,
      data
    );
    return response.data.data!;
  },

  deletePriceBook: async (
    venueId: string,
    priceBookId: string
  ): Promise<void> => {
    await api.delete(`/venues/${venueId}/price-books/${priceBookId}`);
  },

  createPriceRule: async (
    venueId: string,
    priceBookId: string,
    data: CreateVenuePriceRuleRequest
  ): Promise<VenuePriceRule> => {
    const response = await api.post<ApiResponse<VenuePriceRule>>(
      `/venues/${venueId}/price-books/${priceBookId}/rules`,
      data
    );
    return response.data.data!;
  },

  updatePriceRule: async (
    venueId: string,
    priceBookId: string,
    ruleId: string,
    data: UpdateVenuePriceRuleRequest
  ): Promise<VenuePriceRule> => {
    const response = await api.patch<ApiResponse<VenuePriceRule>>(
      `/venues/${venueId}/price-books/${priceBookId}/rules/${ruleId}`,
      data
    );
    return response.data.data!;
  },

  deletePriceRule: async (
    venueId: string,
    priceBookId: string,
    ruleId: string
  ): Promise<void> => {
    await api.delete(
      `/venues/${venueId}/price-books/${priceBookId}/rules/${ruleId}`
    );
  },

  calculateRentalPrice: async (
    venueId: string,
    data: CalculateVenueRentalPriceRequest
  ): Promise<VenueRentalPriceCalculation> => {
    const response = await api.post<ApiResponse<VenueRentalPriceCalculation>>(
      `/venues/${venueId}/calculate-rental-price`,
      data
    );
    return response.data.data!;
  },

  // Canonical Tỉnh/Thành phố -> Phường/Xã list (public), for the new-address
  // dropdowns in venue forms (replaces free-text newDistrict/newCity input).
  getNewAdminUnits: async (): Promise<{ city: string; wards: string[] }[]> => {
    const response = await api.get<
      ApiResponse<{ city: string; wards: string[] }[]>
    >('/venues/new-admin-units');
    return response.data.data || [];
  },

  /**
   * Resolve new-era (Nghị quyết 60) address fields from the CSV mapping.
   * - `rescan`: re-derive every venue, not just those without a newAddress —
   *   required after a mapping fix, since migrated rows are skipped otherwise.
   * - `dryRun`: report what would change without writing.
   */
  migrateAddresses: async (options?: {
    rescan?: boolean;
    dryRun?: boolean;
  }): Promise<MigrateAddressesResult> => {
    const params = new URLSearchParams();
    if (options?.rescan) params.append('rescan', 'true');
    if (options?.dryRun) params.append('dryRun', 'true');
    const query = params.toString();
    const response = await api.post<ApiResponse<MigrateAddressesResult>>(
      `/venues/migrate-addresses${query ? `?${query}` : ''}`
    );
    return response.data.data!;
  },

  /** Rebuild searchTerms for every venue (run after a migrate/rename). */
  backfillSearchTerms: async (): Promise<BackfillResult> => {
    const response = await api.post<ApiResponse<BackfillResult>>(
      '/venues/backfill-search-terms'
    );
    return response.data.data!;
  },

  /** Generate slugs for venues created without one. */
  backfillSlugs: async (): Promise<BackfillResult> => {
    const response = await api.post<ApiResponse<BackfillResult>>(
      '/venues/backfill-slugs'
    );
    return response.data.data!;
  },
};
