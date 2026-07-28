import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDepositStatus,
  getPaymentErrorCode,
  getTransferContent,
} from './venue-rental-payment.ts';

const base = {
  rentalRequestId: 'rental-123',
  status: 'AWAITING_DEPOSIT' as const,
  currency: 'VND',
  totalAmount: 200000,
  depositAmount: 50000,
  depositPaid: 0,
  depositDueAt: null,
  balanceAmount: 150000,
  balancePaid: 0,
  balanceDueAt: null,
  balanceStatus: 'UNPAID' as const,
  totalPaid: 0,
  refunded: 0,
  outstanding: 200000,
  refundEstimate: 0,
  recipient: {
    bankName: null,
    bankAccountNumber: null,
    bankAccountName: null,
    qrUrl: null,
    qrPublicId: null,
  },
  transactions: [],
};

test('derives submitted and paid deposit states', () => {
  assert.equal(
    getDepositStatus({
      ...base,
      transactions: [
        {
          id: 'p1',
          requestId: 'rental-123',
          purpose: 'DEPOSIT',
          status: 'SUBMITTED',
        } as never,
      ],
    }),
    'SUBMITTED'
  );
  assert.equal(getDepositStatus({ ...base, depositPaid: 50000 }), 'PAID');
});

test('uses a stable transfer content', () => {
  assert.equal(getTransferContent('abc-123'), 'VMITO abc-123');
});

test('extracts payment conflict codes', () => {
  assert.equal(
    getPaymentErrorCode({
      response: { data: { message: 'PAYMENT_ALREADY_PROCESSED' } },
    }),
    'PAYMENT_ALREADY_PROCESSED'
  );
  assert.equal(
    getPaymentErrorCode({
      response: {
        data: {
          statusCode: 409,
          message: { code: 'DEPOSIT_EXPIRED', message: 'Deadline passed' },
        },
      },
    }),
    'DEPOSIT_EXPIRED'
  );
});
