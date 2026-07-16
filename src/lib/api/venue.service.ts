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

  migrateAddresses: async (): Promise<{
    message: string;
    total: number;
    matched: number;
    cityOnly: number;
    unmatched: number;
  }> => {
    const response = await api.post<
      ApiResponse<{
        message: string;
        total: number;
        matched: number;
        cityOnly: number;
        unmatched: number;
      }>
    >('/venues/migrate-addresses');
    return response.data.data!;
  },
};
