import { api, ApiResponse } from './base';
import {
  Venue,
  VenueCourt,
  VenueCourtBlock,
  VenueCourtBlockType,
  VenueCourtSchedule,
  VenueCourtStatus,
  VenueCustomerType,
  VenueManager,
  VenueManagerRole,
  VenueRentalAvailability,
  VenueRentalPaymentMethod,
  VenueRentalPaymentSettings,
  VenueRentalPaymentSummary,
  VenueRentalPage,
  VenueRentalProposal,
  VenueRentalQuote,
  VenueRentalRequest,
  VenueRentalSelectionMode,
  VenueRentalStatus,
  VenueRentalTransaction,
  VenueRentalTransactionPurpose,
  VenueOperatingPeriod,
} from './types';

/**
 * Per-request opt-outs. `skipGlobalError` suppresses the global error modal so
 * a caller that already renders the failure inline (e.g. inside a confirmation
 * dialog) does not stack a second error on top of it.
 */
export interface RequestOptions {
  skipGlobalError?: boolean;
}

export interface RentalTimeInput {
  startTime: string;
  endTime: string;
  numberOfCourts: number;
  customerType: VenueCustomerType;
  selectionMode?: VenueRentalSelectionMode;
  courtIds?: string[];
}

export interface RentalFilters {
  venueId?: string;
  status?: VenueRentalStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const withParams = (filters?: RentalFilters) => ({
  params: Object.fromEntries(
    Object.entries(filters || {}).filter(([, value]) => value !== undefined)
  ),
});

export const VenueRentalService = {
  async getPaymentSettings(venueId: string) {
    const response = await api.get<ApiResponse<VenueRentalPaymentSettings>>(
      `/venues/${venueId}/rental-payment-settings`
    );
    return response.data.data!;
  },

  async updatePaymentSettings(
    venueId: string,
    data: Partial<Omit<VenueRentalPaymentSettings, 'id' | 'venueId'>>
  ) {
    const response = await api.patch<ApiResponse<VenueRentalPaymentSettings>>(
      `/venues/${venueId}/rental-payment-settings`,
      data
    );
    return response.data.data!;
  },

  async getPaymentSummary(id: string, options?: RequestOptions) {
    const response = await api.get<ApiResponse<VenueRentalPaymentSummary>>(
      `/venue-rentals/${id}/payment-summary`,
      options
    );
    return response.data.data!;
  },

  async submitPayment(
    id: string,
    data: {
      purpose: Exclude<
        VenueRentalTransactionPurpose,
        VenueRentalTransactionPurpose.REFUND
      >;
      amount: number;
      proofUrl: string;
      proofPublicId?: string;
      notes?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueRentalTransaction>>(
      `/venue-rentals/${id}/payments`,
      data,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  async recordCashPayment(
    id: string,
    data: {
      purpose: Exclude<
        VenueRentalTransactionPurpose,
        VenueRentalTransactionPurpose.REFUND
      >;
      amount: number;
      notes?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueRentalTransaction>>(
      `/venue-rentals/${id}/payments/cash`,
      data,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  async approvePayment(id: string, paymentId: string) {
    const response = await api.post<ApiResponse<VenueRentalTransaction>>(
      `/venue-rentals/${id}/payments/${paymentId}/approve`,
      undefined,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  async rejectPayment(id: string, paymentId: string, reason: string) {
    const response = await api.post<ApiResponse<VenueRentalTransaction>>(
      `/venue-rentals/${id}/payments/${paymentId}/reject`,
      { reason },
      { skipGlobalError: true }
    );
    return response.data.data!;
  },

  async completeRefund(
    id: string,
    refundId: string,
    data: {
      method: VenueRentalPaymentMethod;
      notes?: string;
      proofUrl?: string;
      proofPublicId?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueRentalTransaction>>(
      `/venue-rentals/${id}/refunds/${refundId}/complete`,
      data,
      { skipGlobalError: true }
    );
    return response.data.data!;
  },
  async createQuote(venueId: string, data: RentalTimeInput) {
    const response = await api.post<ApiResponse<VenueRentalQuote>>(
      `/venues/${venueId}/rental-quotes`,
      data
    );
    return response.data.data!;
  },

  async getAvailability(venueId: string, startTime: string, endTime: string) {
    const response = await api.get<ApiResponse<VenueRentalAvailability>>(
      `/venues/${venueId}/rental-availability`,
      { params: { startTime, endTime } }
    );
    return response.data.data!;
  },

  async createRequest(data: {
    quoteId: string;
    contactName: string;
    contactPhone: string;
    notes?: string;
    sessionId?: string;
  }) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      '/venue-rentals',
      data
    );
    return response.data.data!;
  },

  async getMine(filters?: RentalFilters) {
    const response = await api.get<ApiResponse<VenueRentalPage>>(
      '/venue-rentals/my',
      withParams(filters)
    );
    return response.data.data!;
  },

  async getManaged(filters?: RentalFilters) {
    const response = await api.get<ApiResponse<VenueRentalPage>>(
      '/venue-rentals/manage',
      withParams(filters)
    );
    return response.data.data!;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}`
    );
    return response.data.data!;
  },

  async approve(id: string) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/approve`
    );
    return response.data.data!;
  },

  async reject(id: string, reason: string) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/reject`,
      { reason }
    );
    return response.data.data!;
  },

  async propose(id: string, data: RentalTimeInput) {
    const response = await api.post<ApiResponse<VenueRentalProposal>>(
      `/venue-rentals/${id}/proposals`,
      data
    );
    return response.data.data!;
  },

  async acceptProposal(id: string, proposalId: string) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/proposals/${proposalId}/accept`
    );
    return response.data.data!;
  },

  async declineProposal(id: string, proposalId: string) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/proposals/${proposalId}/decline`
    );
    return response.data.data!;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/cancel`,
      { reason }
    );
    return response.data.data!;
  },

  async linkSession(id: string, sessionId: string) {
    const response = await api.patch<ApiResponse<VenueRentalRequest>>(
      `/venue-rentals/${id}/session`,
      { sessionId }
    );
    return response.data.data!;
  },

  async getCourtSchedule(
    venueId: string,
    date: string,
    customerType: VenueCustomerType
  ) {
    const response = await api.get<ApiResponse<VenueCourtSchedule>>(
      `/venues/${venueId}/court-schedule`,
      { params: { date, customerType } }
    );
    return response.data.data!;
  },

  async getManagerCourtSchedule(venueId: string, date: string) {
    const response = await api.get<ApiResponse<VenueCourtSchedule>>(
      `/venues/${venueId}/manage/court-schedule`,
      { params: { date } }
    );
    return response.data.data!;
  },

  async getCourts(venueId: string) {
    const response = await api.get<ApiResponse<VenueCourt[]>>(
      `/venues/${venueId}/courts`
    );
    return response.data.data || [];
  },

  async createCourt(
    venueId: string,
    data: {
      name: string;
      code: string;
      status?: VenueCourtStatus;
      displayOrder?: number;
      notes?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueCourt>>(
      `/venues/${venueId}/courts`,
      data
    );
    return response.data.data!;
  },

  async updateCourt(
    venueId: string,
    courtId: string,
    data: Partial<
      Pick<VenueCourt, 'name' | 'code' | 'status' | 'displayOrder' | 'notes'>
    >
  ) {
    const response = await api.patch<ApiResponse<VenueCourt>>(
      `/venues/${venueId}/courts/${courtId}`,
      data
    );
    return response.data.data!;
  },

  async removeCourt(
    venueId: string,
    courtId: string,
    options?: RequestOptions
  ) {
    await api.delete(`/venues/${venueId}/courts/${courtId}`, options);
  },

  async getOperatingPeriods(venueId: string) {
    const response = await api.get<
      ApiResponse<{
        scheduleNeedsReview: boolean;
        periods: VenueOperatingPeriod[];
      }>
    >(`/venues/${venueId}/operating-periods`);
    return response.data.data!;
  },

  async replaceOperatingPeriods(
    venueId: string,
    periods: VenueOperatingPeriod[],
    markReviewed: boolean
  ) {
    const response = await api.put<
      ApiResponse<{
        scheduleNeedsReview: boolean;
        periods: VenueOperatingPeriod[];
      }>
    >(`/venues/${venueId}/operating-periods`, { periods, markReviewed });
    return response.data.data!;
  },

  async getCourtBlocks(venueId: string) {
    const response = await api.get<ApiResponse<VenueCourtBlock[]>>(
      `/venues/${venueId}/court-blocks`
    );
    return response.data.data || [];
  },

  async createCourtBlock(
    venueId: string,
    data: {
      courtId?: string;
      type: VenueCourtBlockType;
      startTime: string;
      endTime: string;
      reason?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueCourtBlock>>(
      `/venues/${venueId}/court-blocks`,
      data
    );
    return response.data.data!;
  },

  async removeCourtBlock(
    venueId: string,
    blockId: string,
    options?: RequestOptions
  ) {
    await api.delete(`/venues/${venueId}/court-blocks/${blockId}`, options);
  },

  async createManualRental(
    data: RentalTimeInput & {
      venueId: string;
      contactName: string;
      contactPhone: string;
      requesterId?: string;
      notes?: string;
    }
  ) {
    const response = await api.post<ApiResponse<VenueRentalRequest>>(
      '/venue-rentals/manage/manual',
      data
    );
    return response.data.data!;
  },

  async reallocateCourts(id: string, courtIds: string[]) {
    const response = await api.patch<
      ApiResponse<{ courtIds: string[]; rental: VenueRentalRequest }>
    >(`/venue-rentals/${id}/courts`, { courtIds });
    return response.data.data!;
  },

  async getManagedVenues() {
    const response = await api.get<ApiResponse<Venue[]>>(
      '/venues/managed-by-me'
    );
    return response.data.data || [];
  },

  async getManagers(venueId: string) {
    const response = await api.get<ApiResponse<VenueManager[]>>(
      `/venues/${venueId}/managers`
    );
    return response.data.data || [];
  },

  async searchManagerCandidates(venueId: string, query: string) {
    const response = await api.get<
      ApiResponse<
        Array<{
          id: string;
          name: string;
          email: string;
          image?: string;
        }>
      >
    >(`/venues/${venueId}/manager-candidates`, { params: { query } });
    return response.data.data || [];
  },

  async addManager(venueId: string, userId: string, role: VenueManagerRole) {
    const response = await api.post<ApiResponse<VenueManager>>(
      `/venues/${venueId}/managers`,
      { userId, role }
    );
    return response.data.data!;
  },

  async updateManager(
    venueId: string,
    managerId: string,
    role: VenueManagerRole,
    options?: RequestOptions
  ) {
    const response = await api.patch<ApiResponse<VenueManager>>(
      `/venues/${venueId}/managers/${managerId}`,
      { role },
      options
    );
    return response.data.data!;
  },

  async removeManager(
    venueId: string,
    managerId: string,
    options?: RequestOptions
  ) {
    await api.delete(`/venues/${venueId}/managers/${managerId}`, options);
  },

  async updateRentalSettings(
    venueId: string,
    rentalEnabled: boolean,
    timezone: string,
    courtSelectionEnabled?: boolean
  ) {
    const response = await api.patch<ApiResponse<Venue>>(
      `/venues/${venueId}/rental-settings`,
      { rentalEnabled, timezone, courtSelectionEnabled }
    );
    return response.data.data!;
  },
};
