import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  PaymentRecord,
  SubmitPaymentRequest,
  ApprovePaymentRequest,
  RejectPaymentRequest,
  TransactionSummary,
  HostTransactionSummary,
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
    toaster.success({ title: 'Đã gửi yêu cầu thanh toán' });
    return response.data.data!;
  },

  // Get my transaction summary across all hosts
  getMyTransactionSummary: async (): Promise<TransactionSummary[]> => {
    const response = await api.get<ApiResponse<TransactionSummary[]>>(
      '/transactions/summary'
    );
    return response.data.data || [];
  },

  // Get my transactions with a specific host
  getMyTransactionsWithHost: async (hostId: string): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/transactions/with-host/${hostId}`
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
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/sessions/${sessionId}/payments`
    );
    return response.data.data || [];
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
    toaster.success({ title: 'Đã duyệt thanh toán' });
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
    toaster.success({ title: 'Đã từ chối thanh toán' });
    return response.data.data!;
  },

  // Bulk approve payments
  bulkApprovePayments: async (paymentIds: string[]): Promise<PaymentRecord[]> => {
    const response = await api.post<ApiResponse<PaymentRecord[]>>(
      '/payments/bulk-approve',
      { paymentIds }
    );
    toaster.success({ title: `Đã duyệt ${paymentIds.length} thanh toán` });
    return response.data.data || [];
  },

  // Get host's transaction summary per player
  getHostTransactionSummary: async (): Promise<HostTransactionSummary[]> => {
    const response = await api.get<ApiResponse<HostTransactionSummary[]>>(
      '/host/transactions/summary'
    );
    return response.data.data || [];
  },

  // Get host's transactions with a specific user
  getHostTransactionsWithUser: async (
    userId: string
  ): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(
      `/host/transactions/with-user/${userId}`
    );
    return response.data.data || [];
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
    toaster.success({ title: 'Đã tính và phân bổ phí chia đều' });
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
    const response = await api.get<
      ApiResponse<{
        totalPlayers: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        submittedCount: number;
        approvedCount: number;
        pendingCount: number;
        rejectedCount: number;
      }>
    >(`/sessions/${sessionId}/payments/stats`);
    return (
      response.data.data || {
        totalPlayers: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        submittedCount: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
      }
    );
  },
};
