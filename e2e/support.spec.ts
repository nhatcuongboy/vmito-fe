import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const locales = ['vi', 'en', 'cn'] as const;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.route('**/feature-flags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  );
});

test('support is public, localized, and has no horizontal overflow', async ({
  page,
}) => {
  for (const locale of locales) {
    await page.goto(`/${locale}/support`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(
      hasHorizontalOverflow,
      `${locale} support overflows horizontally`
    ).toBe(false);
  }
});

test('support search, FAQ feedback, and direct contact links work', async ({
  page,
}) => {
  await page.goto('/vi/support');

  const search = page.getByRole('textbox', {
    name: 'Tìm kiếm trong trung tâm hỗ trợ',
  });
  await search.fill('xoay tua');
  await expect(
    page.getByRole('button', {
      name: 'Vmito có thể tự động xếp người chơi không?',
    })
  ).toBeVisible();
  await expect(page.getByText('Làm sao để tạo một kèo mới?')).toHaveCount(0);

  await page
    .getByRole('button', { name: 'Vmito có thể tự động xếp người chơi không?' })
    .click();
  await page.getByRole('button', { name: 'Có', exact: true }).click();
  await expect(page.getByText('Cảm ơn phản hồi của bạn!')).toBeVisible();

  const contactSection = page.locator('#support-request');
  await expect(
    contactSection.locator('a[href="tel:0914810765"]')
  ).toBeVisible();
  await expect(
    contactSection.locator('a[href="mailto:admin@vmito.com"]')
  ).toBeVisible();
  await expect(
    contactSection.locator('a[href="https://zalo.me/84914810765"]')
  ).toBeVisible();
  await expect(
    contactSection.locator('a[href="https://m.me/vmitovn"]')
  ).toBeVisible();
});

test('support offers guest sign-in and remains accessible', async ({
  page,
}) => {
  await page.goto('/vi/support');
  await expect(page.getByText('Đăng nhập để gửi ticket')).toBeVisible();

  const signIn = page
    .locator('#support-request')
    .getByRole('link', { name: 'Đăng nhập', exact: true });
  await expect(signIn).toHaveAttribute(
    'href',
    '/vi/auth/signin?returnUrl=%2Fsupport%23support-request'
  );

  await page.goto('/vi/support');
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze();
  const blockingViolations = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(blockingViolations).toEqual([]);
});

test('signed-in users can submit a support ticket', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: 'support-test-user',
            name: 'Support Test User',
            email: 'support-test@example.com',
            role: 'PLAYER',
          },
          accessToken: 'support-test-token',
          refreshToken: 'support-test-refresh-token',
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  });

  let submittedRequest:
    | { title: string; description: string; type: string }
    | undefined;
  await page.route('**/feedback', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as {
      title: string;
      description: string;
      type: string;
    };
    submittedRequest = body;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'support-ticket-1',
          ...body,
          type: 'CONTACT',
          status: 'PENDING',
        },
      }),
    });
  });

  await page.goto('/vi/support');
  const form = page.locator('#support-request form');
  await expect(form).toBeVisible();
  await form.getByLabel('Tiêu đề').fill('Cần hỗ trợ về thanh toán');
  await form
    .getByLabel('Nội dung')
    .fill('Tôi cần kiểm tra trạng thái giao dịch.');
  await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();

  await expect
    .poll(() => submittedRequest)
    .toEqual({
      title: 'Cần hỗ trợ về thanh toán',
      description: 'Tôi cần kiểm tra trạng thái giao dịch.',
      type: 'CONTACT',
    });
  await expect(form.getByLabel('Tiêu đề')).toHaveValue('');
  await expect(page.getByText('Xem phản hồi của tôi')).toBeVisible();
});
