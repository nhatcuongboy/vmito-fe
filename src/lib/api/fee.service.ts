import { toaster } from '@/components/ui/toaster';
import { api, ApiResponse } from './base';
import {
  SessionFeeConfig,
  CreateSessionFeeConfigRequest,
  UpdateSessionFeeConfigRequest,
  FeeType,
  ISession,
} from './types';

export const FeeService = {
  // Get fee config for a session
  getSessionFeeConfig: async (
    sessionId: string
  ): Promise<SessionFeeConfig | null> => {
    try {
      const response = await api.get<ApiResponse<SessionFeeConfig>>(
        `/sessions/${sessionId}/fee-config`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Create fee config for a session
  createSessionFeeConfig: async (
    sessionId: string,
    data: CreateSessionFeeConfigRequest
  ): Promise<SessionFeeConfig> => {
    const response = await api.post<ApiResponse<SessionFeeConfig>>(
      `/sessions/${sessionId}/fee-config`,
      data
    );
    toaster.success({ title: 'Đã cấu hình phí thành công' });
    return response.data.data!;
  },

  // Update fee config
  updateSessionFeeConfig: async (
    sessionId: string,
    data: UpdateSessionFeeConfigRequest
  ): Promise<SessionFeeConfig> => {
    const response = await api.put<ApiResponse<SessionFeeConfig>>(
      `/sessions/${sessionId}/fee-config`,
      data
    );
    toaster.success({ title: 'Đã cập nhật phí thành công' });
    return response.data.data!;
  },

  // Delete fee config
  deleteSessionFeeConfig: async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/fee-config`);
    toaster.success({ title: 'Đã xóa cấu hình phí' });
  },

  // Recalculate all payments based on latest fee config
  recalculateAllPayments: async (
    sessionId: string
  ): Promise<{ updated: number; message: string }> => {
    const response = await api.post<
      ApiResponse<{ updated: number; message: string }>
    >(`/sessions/${sessionId}/fee-config/recalculate`);
    return response.data.data!;
  },

  // Calculate fee for a player based on gender and slots
  calculatePlayerFee: (
    feeConfig: SessionFeeConfig | null | undefined,
    gender: 'MALE' | 'FEMALE',
    slots: number = 1
  ): number => {
    if (!feeConfig) return 0;
    if (feeConfig.feeType === FeeType.SPLIT_EVENLY) {
      // Return the calculated split per player if available
      return (feeConfig.splitPerPlayer || 0) * slots;
    }
    const baseFee = gender === 'MALE' ? feeConfig.maleFee : feeConfig.femaleFee;
    return (baseFee || 0) * slots;
  },

  // Format fee for display (e.g., "80k - 100k" or "80,000đ")
  formatFee: (amount: number): string => {
    if (amount === 0) return 'Miễn phí';
    if (amount >= 1000) {
      const k = amount / 1000;
      if (Number.isInteger(k)) {
        return `${k}k`;
      }
      return `${k.toFixed(1)}k`;
    }
    return `${amount.toLocaleString('vi-VN')}đ`;
  },

  // Format fee as exact number with vi-VN locale (e.g., "85.000đ")
  formatFeeExact: (amount: number): string => {
    if (amount === 0) return '0đ';
    return `${amount.toLocaleString('vi-VN')}đ`;
  },

  // Format money in payment summaries where zero means no remaining balance.
  formatPaymentAmount: (amount: number): string => {
    if (amount === 0) return '0';
    return FeeService.formatFee(amount);
  },

  // Get fee display text for session card
  getFeeDisplayText: (
    feeConfig: SessionFeeConfig | null | undefined
  ): string => {
    if (!feeConfig) return '';

    if (feeConfig.feeType === FeeType.SPLIT_EVENLY) {
      if (feeConfig.splitPerPlayer) {
        return FeeService.formatFee(feeConfig.splitPerPlayer);
      }
      return 'Chia đều';
    }

    const maleFee = feeConfig.maleFee || 0;
    const femaleFee = feeConfig.femaleFee || 0;

    if (maleFee === 0 && femaleFee === 0) {
      return 'Miễn phí';
    }

    if (maleFee === femaleFee) {
      return FeeService.formatFee(maleFee);
    }

    const minFee = Math.min(maleFee, femaleFee);
    const maxFee = Math.max(maleFee, femaleFee);

    return `${FeeService.formatFee(minFee)}-${FeeService.formatFee(maxFee)}`;
  },

  canViewerSeeSessionFee: (
    session: Pick<ISession, 'clubId' | 'hostId'>,
    viewerUserId?: string,
    viewerClubIds?: Set<string>
  ): boolean => {
    if (!session.clubId) return true;
    if (viewerUserId && viewerUserId === session.hostId) return true;
    return Boolean(viewerClubIds?.has(session.clubId));
  },

  getSessionFeeDisplayText: (
    session: Pick<ISession, 'feeConfig' | 'clubId' | 'hostId'>,
    viewerUserId?: string,
    viewerClubIds?: Set<string>,
    hiddenFeeText = 'Liên hệ host'
  ): string => {
    if (
      !FeeService.canViewerSeeSessionFee(session, viewerUserId, viewerClubIds)
    ) {
      return hiddenFeeText;
    }

    return FeeService.getFeeDisplayText(session.feeConfig);
  },

  /**
   * Get session fee for card display - always shows session fee (maleFee/femaleFee)
   * Used in session cards, search results, etc.
   */
  getSessionFeeForCard: (session: Pick<ISession, 'feeConfig'>): string => {
    return FeeService.getFeeDisplayText(session.feeConfig);
  },

  /**
   * Get session fee for modal/detail - shows "Contact host" for club sessions
   * Used in registration modals, detailed views where club fee context is important
   */
  getSessionFeeForModal: (
    session: Pick<ISession, 'feeConfig' | 'clubId' | 'hostId'>,
    viewerUserId?: string,
    viewerClubIds?: Set<string>,
    hiddenFeeText = 'Liên hệ host'
  ): string => {
    if (
      !FeeService.canViewerSeeSessionFee(session, viewerUserId, viewerClubIds)
    ) {
      return hiddenFeeText;
    }

    return FeeService.getFeeDisplayText(session.feeConfig);
  },
};
