import { api, ApiResponse } from './base';
import { Venue } from './types';

export const VenueService = {
  // Get all venues
  getAllVenues: async (): Promise<Venue[]> => {
    const response = await api.get<ApiResponse<Venue[]>>('/venues');
    return response.data.data || [];
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
};
