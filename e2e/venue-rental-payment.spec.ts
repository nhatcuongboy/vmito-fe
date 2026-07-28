import { expect, Page, Route, test } from '@playwright/test';

type SetupOptions = {
  locale?: 'en' | 'vi' | 'cn';
  manage?: boolean;
  status?: string;
  dueAt?: string | null;
  balanceStatus?: 'UNPAID' | 'SUBMITTED' | 'PAID' | 'OVERDUE';
  transactions?: Array<Record<string, unknown>>;
  conflictOnApprove?: boolean;
  refundEstimate?: number;
  noDeposit?: boolean;
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const transaction = (
  purpose: 'DEPOSIT' | 'BALANCE' | 'REFUND',
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED',
  id = `${purpose.toLowerCase()}-1`
) => ({
  id,
  requestId: 'rental-1',
  purpose,
  direction: purpose === 'REFUND' ? 'OUT' : 'IN',
  method: purpose === 'REFUND' ? null : 'BANK_TRANSFER',
  status,
  amount: purpose === 'DEPOSIT' ? 100_000 : 400_000,
  currency: 'VND',
  proofUrl: status === 'SUBMITTED' ? 'https://example.com/proof.png' : null,
  proofPublicId: null,
  notes: null,
  submittedAt: new Date().toISOString(),
  approvedAt: status === 'APPROVED' ? new Date().toISOString() : null,
  rejectedAt: status === 'REJECTED' ? new Date().toISOString() : null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  submittedBy: { id: 'renter-1', name: 'Renter', image: null },
  processedBy: null,
});

async function setup(page: Page, options: SetupOptions = {}) {
  const manage = options.manage ?? false;
  let rentalStatus = options.status ?? 'AWAITING_DEPOSIT';
  let updatedAt = new Date().toISOString();
  let transactions = options.transactions ? [...options.transactions] : [];
  let balanceStatus = options.balanceStatus ?? 'UNPAID';
  let depositPaid = transactions.some(
    (item) => item.purpose === 'DEPOSIT' && item.status === 'APPROVED'
  )
    ? 100_000
    : 0;

  await page.addInitScript((manager) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: manager ? 'manager-1' : 'renter-1',
            name: manager ? 'Manager' : 'Renter',
            email: 'test@vmito.local',
            role: 'HOST',
          },
          accessToken: 'e2e-token',
          refreshToken: 'e2e-refresh',
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  }, manage);

  const rental = () => ({
    id: 'rental-1',
    venueId: 'venue-1',
    requesterId: 'renter-1',
    status: rentalStatus,
    contactName: 'Nguyen Van A',
    contactPhone: '0900000000',
    notes: null,
    rejectionReason: null,
    cancellationReason: rentalStatus === 'CANCELLED' ? 'USER_CANCELLED' : null,
    confirmedStartTime: new Date(Date.now() + 86_400_000).toISOString(),
    confirmedEndTime: new Date(Date.now() + 90_000_000).toISOString(),
    confirmedNumberOfCourts: 2,
    confirmedCustomerType: 'WALK_IN',
    confirmedAmount: 500_000,
    confirmedCurrency: 'VND',
    quote: null,
    source: 'ONLINE',
    selectionMode: 'AUTO_ASSIGN',
    requestedCourtIds: [],
    courtAllocations: [],
    proposals: [],
    events: [],
    venue: {
      id: 'venue-1',
      slug: 'demo-venue',
      name: 'Demo Venue',
      address: 'Ho Chi Minh City',
      timezone: 'Asia/Ho_Chi_Minh',
    },
    session: null,
    createdAt: new Date().toISOString(),
    updatedAt,
  });

  const summary = () => ({
    rentalRequestId: 'rental-1',
    status: rentalStatus,
    currency: 'VND',
    totalAmount: 500_000,
    depositAmount:
      options.noDeposit || rentalStatus === 'PENDING' ? 0 : 100_000,
    depositPaid,
    depositDueAt:
      options.dueAt === undefined
        ? new Date(Date.now() + 30 * 60_000).toISOString()
        : options.dueAt,
    balanceAmount: options.noDeposit ? 500_000 : 400_000,
    balancePaid: balanceStatus === 'PAID' ? 400_000 : 0,
    balanceDueAt: new Date(Date.now() + 12 * 60 * 60_000).toISOString(),
    balanceStatus,
    totalPaid: depositPaid,
    refunded: 0,
    outstanding: 500_000 - depositPaid,
    refundEstimate: options.refundEstimate ?? 80_000,
    recipient: {
      bankName: 'VCB',
      bankAccountNumber: '0123456789',
      bankAccountName: 'VMITO VENUE',
      qrUrl: null,
      qrPublicId: null,
    },
    transactions,
  });

  await page.route('**/user-images**', (route) =>
    json(route, {
      success: true,
      data: {
        id: 'image-1',
        url: 'https://example.com/proof.png',
        publicId: 'proof-1',
        category: 'PAYMENT_PROOF',
      },
    })
  );

  await page.route('**/venue-rentals/rental-1**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname;

    if (method === 'GET' && path.endsWith('/payment-summary')) {
      return json(route, { success: true, data: summary() });
    }
    if (method === 'GET' && path.endsWith('/venue-rentals/rental-1')) {
      return json(route, { success: true, data: rental() });
    }
    if (method === 'POST' && path.endsWith('/payments')) {
      const body = route.request().postDataJSON();
      const created = {
        ...transaction(body.purpose, 'SUBMITTED', `submitted-${body.purpose}`),
        amount: body.amount,
      };
      transactions.push(created);
      if (body.purpose === 'BALANCE') balanceStatus = 'SUBMITTED';
      return json(route, { success: true, data: created });
    }
    if (method === 'POST' && path.endsWith('/payments/cash')) {
      const body = route.request().postDataJSON();
      const created = {
        ...transaction(body.purpose, 'APPROVED', `cash-${body.purpose}`),
        method: 'CASH',
        amount: body.amount,
      };
      transactions.push(created);
      if (body.purpose === 'DEPOSIT') {
        depositPaid = 100_000;
        rentalStatus = 'CONFIRMED';
      } else {
        balanceStatus = 'PAID';
      }
      updatedAt = new Date(Date.now() + 1000).toISOString();
      return json(route, { success: true, data: created });
    }
    if (method === 'POST' && path.endsWith('/approve')) {
      transactions = transactions.map((item) => ({
        ...item,
        status: item.status === 'SUBMITTED' ? 'APPROVED' : item.status,
      }));
      depositPaid = options.noDeposit ? 0 : 100_000;
      rentalStatus = 'CONFIRMED';
      updatedAt = new Date(Date.now() + 1000).toISOString();
      if (options.conflictOnApprove) {
        return json(
          route,
          {
            statusCode: 409,
            message: {
              code: 'PAYMENT_ALREADY_PROCESSED',
              message: 'Payment already processed',
            },
          },
          409
        );
      }
      return json(route, { success: true, data: transactions[0] });
    }
    if (method === 'POST' && path.endsWith('/reject')) {
      transactions = transactions.map((item) => ({
        ...item,
        status: item.status === 'SUBMITTED' ? 'REJECTED' : item.status,
      }));
      return json(route, { success: true, data: transactions[0] });
    }
    if (method === 'POST' && path.includes('/refunds/')) {
      transactions = transactions.map((item) => ({
        ...item,
        status: item.purpose === 'REFUND' ? 'APPROVED' : item.status,
      }));
      return json(route, { success: true, data: transactions[0] });
    }
    if (method === 'POST' && path.endsWith('/cancel')) {
      rentalStatus = 'CANCELLED';
      updatedAt = new Date(Date.now() + 1000).toISOString();
      transactions.push(transaction('REFUND', 'PENDING', 'refund-1'));
      return json(route, { success: true, data: rental() });
    }
    return json(route, { success: true, data: {} });
  });

  const locale = options.locale ?? 'en';
  await page.goto(
    manage
      ? `/${locale}/manage/venues/rentals/rental-1`
      : `/${locale}/my/rentals/rental-1`
  );
  if (rentalStatus !== 'PENDING') {
    const titles = {
      en: manage ? 'Payment transactions' : 'Rental payment',
      vi: manage ? 'Giao dịch thanh toán' : 'Thanh toán thuê sân',
      cn: manage ? '付款交易' : '租场付款',
    };
    await expect(page.getByText(titles[locale])).toBeVisible();
  } else {
    await expect(page.getByText('Demo Venue')).toBeVisible();
  }
}

test('shows an authoritative deposit countdown and amount-specific VietQR', async ({
  page,
}) => {
  await setup(page);
  await expect(page.getByText(/00:2\d:/)).toBeVisible();
  await expect(page.getByText(/Amount: 100[.,]000/)).toBeVisible();
  await expect(page.getByText('VMITO rental-1')).toBeVisible();
});

test('renter uploads and submits deposit proof', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: 'Submit deposit proof' }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from('proof'),
  });
  await page.getByRole('button', { name: 'Submit proof', exact: true }).click();
  await expect(page.getByText('Submitted').first()).toBeVisible();
});

test('manager approves a submitted deposit and booking becomes confirmed', async ({
  page,
}) => {
  await setup(page, {
    manage: true,
    transactions: [transaction('DEPOSIT', 'SUBMITTED')],
  });
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();
  await expect(page.getByText('Confirmed').first()).toBeVisible();
});

test('manager rejects proof so renter can resubmit', async ({ page }) => {
  await setup(page, {
    manage: true,
    transactions: [transaction('DEPOSIT', 'SUBMITTED')],
  });
  await page.getByRole('button', { name: 'Reject' }).click();
  await page.getByLabel('Rejection reason').fill('Unreadable proof');
  await page
    .getByRole('button', { name: 'Reject', exact: true })
    .last()
    .click();
  await expect(page.getByText('Rejected').first()).toBeVisible();
});

test('expired deposit disables submission', async ({ page }) => {
  await setup(page, { dueAt: new Date(Date.now() - 1000).toISOString() });
  await expect(page.getByText(/deposit deadline has passed/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Submit deposit proof' })
  ).toHaveCount(0);
});

test('renter submits a balance bank transfer', async ({ page }) => {
  await setup(page, {
    status: 'CONFIRMED',
    transactions: [transaction('DEPOSIT', 'APPROVED')],
  });
  await page.getByRole('button', { name: 'Submit balance proof' }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'balance.png',
    mimeType: 'image/png',
    buffer: Buffer.from('balance'),
  });
  await page.getByRole('button', { name: 'Submit proof', exact: true }).click();
  await expect(page.getByText('Submitted').first()).toBeVisible();
});

test('manager records a cash payment', async ({ page }) => {
  await setup(page, { manage: true });
  await page.getByRole('button', { name: 'Record cash payment' }).click();
  await page.getByRole('button', { name: 'Confirm cash received' }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();
});

test('overdue balance keeps a confirmed booking', async ({ page }) => {
  await setup(page, { status: 'CONFIRMED', balanceStatus: 'OVERDUE' });
  await expect(page.getByText('Overdue').first()).toBeVisible();
  await expect(page.getByText('Confirmed').first()).toBeVisible();
});

test('cancel confirmation shows the latest refund estimate', async ({
  page,
}) => {
  await setup(page, { status: 'CONFIRMED', refundEstimate: 80_000 });
  await page.getByRole('button', { name: 'Cancel request' }).click();
  const cancelDialog = page.getByLabel('Cancel request');
  await expect(cancelDialog.getByText('Estimated refund')).toBeVisible();
  await expect(cancelDialog.getByText(/80[.,]000/)).toBeVisible();
});

test('manager completes a pending refund', async ({ page }) => {
  await setup(page, {
    manage: true,
    status: 'CANCELLED',
    transactions: [transaction('REFUND', 'PENDING', 'refund-1')],
  });
  await page.getByRole('button', { name: 'Complete refund' }).click();
  await page.getByLabel('Notes').fill('Transferred to renter');
  await page.getByRole('button', { name: 'Confirm refund completed' }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();
});

test('a second manager handles the approve race by refetching approved state', async ({
  page,
}) => {
  await setup(page, {
    manage: true,
    transactions: [transaction('DEPOSIT', 'SUBMITTED')],
    conflictOnApprove: true,
  });
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Approved').first()).toBeVisible();
});

test('depositMode NONE keeps the direct confirmation workflow', async ({
  page,
}) => {
  await setup(page, {
    manage: true,
    status: 'PENDING',
    noDeposit: true,
  });
  await page.getByRole('button', { name: 'Confirm rental' }).click();
  await expect(page.getByText('Confirmed').first()).toBeVisible();
  await expect(page.getByText('Payment transactions')).toBeVisible();
});

for (const locale of ['en', 'vi', 'cn'] as const) {
  test(`payment layout remains usable on mobile in ${locale}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setup(page, { locale });
    await expect(page.locator('#rental-payment')).toBeVisible();
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });
}
