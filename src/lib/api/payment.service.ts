import { toaster } from '@/components/ui/toaster';
import { getToastMessage } from '@/lib/i18n/toastMessages';
import { api, ApiResponse } from './base';
import {
  PaymentRecord,
  SubmitPaymentRequest,
  ApprovePaymentRequest,
  RejectPaymentRequest,
  TransactionSummary,
  HostTransactionSummary,
  HostTransactionsWithUserResponse,
  SessionPaymentsResponse,
  PaymentStats,
} from './types';

export const PaymentService = {
  // ==========================================
  // Player Actions
  // ==========================================

  // Get my payment records for a session
  getMySessionPayments: async (sessionId: string): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/sessions/${sessionId}/my-payments`
    );
    return response.data.data || [];
  },

  // Submit payment (player marks as paid)
  submitPayment: async (
    paymentId: string,
    data: SubmitPaymentRequest
  ): Promise<PaymentRecord> => {
    const response = await api.post<ApiResponse<PaymentRecord>>(
      `/payments/${paymentId}/submit`,
      data
    );
    toaster.success({ title: getToastMessage('paymentRequestSent') });
    return response.data.data!;
  },

  // Get my transaction summary across all hosts
  getMyTransactionSummary: async (): Promise<TransactionSummary[]> => {
    const response = await api.get<ApiResponse<TransactionSummary[]>>(
      '/payments/me/summary'
    );
    return response.data.data || [];
  },

  // Get my transactions with a specific host
  getMyTransactionsWithHost: async (
    hostId: string
  ): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/payments/me/host/${hostId}`
    );
    return response.data.data || [];
  },

  // Upload payment proof image
  uploadPaymentProof: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('proof', file);
    const response = await api.post<ApiResponse<{ url: string }>>(
      '/upload/payment-proof',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!.url;
  },

  // ==========================================
  // Host Actions
  // ==========================================

  // Get all payments for a session (host only)
  getSessionPayments: async (sessionId: string): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<SessionPaymentsResponse>>(
      `/sessions/${sessionId}/payments`
    );
    // API returns { data: { payments: [...], stats: {...} } }
    return response.data.data?.payments || [];
  },

  // Get payments with filters
  getSessionPaymentsWithFilters: async (
    sessionId: string,
    filters?: {
      status?: string;
      paymentMethod?: string;
    }
  ): Promise<PaymentRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentMethod)
      params.append('paymentMethod', filters.paymentMethod);

    const url = params.toString()
      ? `/sessions/${sessionId}/payments?${params.toString()}`
      : `/sessions/${sessionId}/payments`;

    const response = await api.get<ApiResponse<PaymentRecord[]>>(url);
    return response.data.data || [];
  },

  // Approve payment (host only)
  approvePayment: async (
    paymentId: string,
    data?: ApprovePaymentRequest
  ): Promise<PaymentRecord> => {
    const response = await api.post<ApiResponse<PaymentRecord>>(
      `/payments/${paymentId}/approve`,
      data || {}
    );
    toaster.success({ title: getToastMessage('paymentApproved') });
    return response.data.data!;
  },

  // Reject payment (host only)
  rejectPayment: async (
    paymentId: string,
    data: RejectPaymentRequest
  ): Promise<PaymentRecord> => {
    const response = await api.post<ApiResponse<PaymentRecord>>(
      `/payments/${paymentId}/reject`,
      data
    );
    toaster.success({ title: getToastMessage('paymentRejected') });
    return response.data.data!;
  },

  // Bulk approve payments
  bulkApprovePayments: async (
    paymentIds: string[]
  ): Promise<PaymentRecord[]> => {
    const response = await api.post<ApiResponse<PaymentRecord[]>>(
      '/payments/bulk-approve',
      { paymentIds }
    );
    toaster.success({
      title: getToastMessage('paymentsApproved', {
        count: paymentIds.length,
      }),
    });
    return response.data.data || [];
  },

  // Get host's transaction summary per player
  getHostTransactionSummary: async (): Promise<HostTransactionSummary[]> => {
    const response = await api.get<ApiResponse<HostTransactionSummary[]>>(
      '/payments/host/summary'
    );
    return response.data.data || [];
  },

  // Get host's transactions with a specific user
  // API returns { user, payments, summary }; we only need the payments list here.
  getHostTransactionsWithUser: async (
    userId: string
  ): Promise<PaymentRecord[]> => {
    const response = await api.get<
      ApiResponse<HostTransactionsWithUserResponse>
    >(`/payments/host/user/${userId}`);
    return response.data.data?.payments ?? [];
  },

  // Set split amount after session (for SPLIT_EVENLY type)
  setSplitAmount: async (
    sessionId: string,
    totalAmount: number
  ): Promise<PaymentRecord[]> => {
    const response = await api.post<ApiResponse<PaymentRecord[]>>(
      `/sessions/${sessionId}/payments/split`,
      { totalAmount }
    );
    toaster.success({
      title: getToastMessage('feesCalculatedAndSplitSuccessfully'),
    });
    return response.data.data || [];
  },

  // Get payment statistics for a session
  getSessionPaymentStats: async (
    sessionId: string
  ): Promise<{
    totalPlayers: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    submittedCount: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
  }> => {
    const response = await api.get<ApiResponse<PaymentStats>>(
      `/sessions/${sessionId}/payments/stats`
    );
    const stats = response.data.data || ({} as PaymentStats);

    // Map API response format to frontend type
    // API returns: { total, pending, submitted, approved, rejected, totalAmount, paidAmount }
    // Frontend expects: { totalPlayers, totalAmount, paidAmount, pendingAmount, submittedCount, approvedCount, pendingCount, rejectedCount }
    const pendingAmount = (stats.totalAmount || 0) - (stats.paidAmount || 0);

    return {
      totalPlayers: stats.total || 0,
      totalAmount: stats.totalAmount || 0,
      paidAmount: stats.paidAmount || 0,
      pendingAmount: pendingAmount,
      submittedCount: stats.submitted || 0,
      approvedCount: stats.approved || 0,
      pendingCount: stats.pending || 0,
      rejectedCount: stats.rejected || 0,
    };
  },
};
