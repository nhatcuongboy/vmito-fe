import type { VenueRentalPaymentSummary } from './api/types';

export const venueRentalPaymentKeys = {
  all: ['venue-rental-payments'] as const,
  settings: (venueId: string) =>
    [...venueRentalPaymentKeys.all, 'settings', venueId] as const,
  detail: (rentalRequestId: string) =>
    [...venueRentalPaymentKeys.all, 'summary', rentalRequestId] as const,
  managerDashboard: (venueId?: string) =>
    [
      ...venueRentalPaymentKeys.all,
      'manager-dashboard',
      venueId || 'all',
    ] as const,
};

export type DerivedDepositStatus = 'UNPAID' | 'SUBMITTED' | 'PAID' | 'EXPIRED';

export const getDepositStatus = (
  summary: VenueRentalPaymentSummary,
  cancellationReason?: string | null
): DerivedDepositStatus => {
  if (summary.depositPaid >= summary.depositAmount) return 'PAID';
  if (
    summary.status === 'CANCELLED' &&
    cancellationReason === 'DEPOSIT_EXPIRED'
  ) {
    return 'EXPIRED';
  }
  if (
    summary.transactions.some(
      (transaction) =>
        transaction.purpose === 'DEPOSIT' && transaction.status === 'SUBMITTED'
    )
  ) {
    return 'SUBMITTED';
  }
  return 'UNPAID';
};

export const getTransferContent = (rentalRequestId: string) =>
  `VMITO ${rentalRequestId}`;

export const getPaymentErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') return null;
  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (!data || typeof data !== 'object') return null;
  const values: unknown[] = [data];
  const root = data as { message?: unknown; error?: unknown };
  values.push(root.message, root.error);
  for (const value of values) {
    const candidates =
      value && typeof value === 'object'
        ? [
            (value as { code?: unknown }).code,
            (value as { message?: unknown }).message,
          ]
        : [value];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const match = candidate.match(
          /DEPOSIT_EXPIRED|PAYMENT_ALREADY_PROCESSED|PAYMENT_AMOUNT_EXCEEDED|PAYMENT_NOT_REQUIRED|REFUND_ALREADY_COMPLETED|INVALID_TRANSITION/
        );
        if (match) return match[0];
      }
    }
  }
  return null;
};

export const isPaymentConflict = (error: unknown) =>
  !!error &&
  typeof error === 'object' &&
  (error as { response?: { status?: number } }).response?.status === 409;
