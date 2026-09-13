import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const CONSENT_COOKIE = 'vmito_cookie_consent';
const GOOGLE_SCRIPT_SELECTOR = 'script[src*="accounts.google.com/gsi/client"]';
const blockingA11yImpacts = new Set(['serious', 'critical']);

async function expectNoBlockingA11yViolations(page: Page, selector?: string) {
  let builder = new AxeBuilder({ page }).disableRules(['color-contrast']);
  if (selector) builder = builder.include(selector);
  const results = await builder.analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact && blockingA11yImpacts.has(violation.impact)
  );
  expect(blockingViolations).toEqual([]);
}

function readConsentCookie(page: Page) {
  return page
    .context()
    .cookies()
    .then((cookies) =>
      cookies.find((cookie) => cookie.name === CONSENT_COOKIE)
    );
}

// Matches e2e/ui-foundation.spec.ts: several tests hit the on-demand Next.js
// dev server, and running them concurrently makes route compilation flaky.
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/feature-flags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  );
  // The homepage's session cards batch-fetch host rating stats via POST.
  // Left unmocked, a failed request opens GlobalErrorModal (z-index above
  // the consent banner) and makes the suite flaky against a real backend.
  await page.route('**/ratings/users/batch-stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    })
  );
});

test('new user sees the consent banner before automatic popups and blocks Google One Tap', async ({
  page,
}) => {
  await page.goto('/vi');

  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole('heading', { name: 'Tùy chọn cookie của bạn' })
  ).toBeVisible();

  // The city-onboarding modal is another auto-opening popup on discovery
  // pages; consent must be resolved before it is allowed to appear.
  await expect(
    page.getByRole('dialog', { name: 'Bạn đang ở đâu?' })
  ).toHaveCount(0);

  // Not resolved yet, so Google GIS must not be requested at all.
  await page.waitForTimeout(300);
  await expect(page.locator(GOOGLE_SCRIPT_SELECTOR)).toHaveCount(0);

  // Non-modal: unlike VModal-based popups, the banner renders no
  // full-viewport overlay/backdrop element of its own.
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});

test('"Chỉ cần thiết" stores the necessary cookie and keeps Google One Tap disabled', async ({
  page,
}) => {
  await page.goto('/vi');
  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();

  const necessaryButton = banner.getByRole('button', { name: 'Chỉ cần thiết' });
  await necessaryButton.focus();
  await page.keyboard.press('Enter');

  await expect(banner).toBeHidden();
  const cookie = await readConsentCookie(page);
  expect(cookie?.value).toBe('v1.necessary');

  // Consent resolved: other auto popups may now appear, but Google One Tap
  // must stay off because "necessary" was chosen.
  await expect(
    page.getByRole('dialog', { name: 'Bạn đang ở đâu?' })
  ).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator(GOOGLE_SCRIPT_SELECTOR)).toHaveCount(0);
});

test('"Đồng ý tất cả" stores the all-consent cookie and allows Google One Tap to load', async ({
  page,
}) => {
  await page.goto('/vi');
  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();

  await banner.getByRole('button', { name: 'Đồng ý tất cả' }).click();

  await expect(banner).toBeHidden();
  const cookie = await readConsentCookie(page);
  expect(cookie?.value).toBe('v1.all');

  await expect(page.locator(GOOGLE_SCRIPT_SELECTOR)).toHaveCount(1, {
    timeout: 5_000,
  });
});

test('reloading and switching locale do not reopen the banner', async ({
  page,
}) => {
  await page.goto('/vi');
  const banner = page.getByTestId('cookie-consent-banner');
  await banner.getByRole('button', { name: 'Đồng ý tất cả' }).click();
  await expect(banner).toBeHidden();

  await page.reload();
  await expect(page.getByTestId('cookie-consent-banner')).toHaveCount(0);

  await page.goto('/en');
  await expect(page.getByTestId('cookie-consent-banner')).toHaveCount(0);

  const cookie = await readConsentCookie(page);
  expect(cookie?.value).toBe('v1.all');
});

test('an invalid or outdated consent cookie brings the banner back', async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: CONSENT_COOKIE,
      value: 'v0.all',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  await page.goto('/vi');
  await expect(page.getByTestId('cookie-consent-banner')).toBeVisible();
});

test('the privacy page cookie settings action reopens and updates the choice', async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: CONSENT_COOKIE,
      value: 'v1.necessary',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  await page.goto('/vi/privacy');
  await expect(page.getByTestId('cookie-consent-banner')).toHaveCount(0);

  await page.getByRole('button', { name: 'Cài đặt cookie' }).click();

  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();
  const closeButton = banner.getByRole('button', {
    name: 'Đóng cài đặt cookie',
  });
  await expect(closeButton).toBeVisible();

  await banner.getByRole('button', { name: 'Đồng ý tất cả' }).click();
  await expect(banner).toBeHidden();

  const cookie = await readConsentCookie(page);
  expect(cookie?.value).toBe('v1.all');
});

test('the banner is localized for vi/en/cn', async ({ page }) => {
  const expectations: Record<string, string> = {
    vi: 'Tùy chọn cookie của bạn',
    en: 'Your cookie choices',
    cn: '您的 Cookie 选择',
  };

  for (const [locale, title] of Object.entries(expectations)) {
    await page.context().clearCookies();
    await page.goto(`/${locale}`);
    const banner = page.getByTestId('cookie-consent-banner');
    await expect(banner.getByRole('heading', { name: title })).toBeVisible();
  }
});

test('the banner stays responsive, clears the bottom nav, and has no blocking a11y issues', async ({
  page,
}, testInfo) => {
  await page.goto('/vi');
  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(hasHorizontalOverflow).toBe(false);

  const bottomOffset = await banner.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).bottom)
  );
  if (testInfo.project.name === 'desktop-chromium') {
    expect(bottomOffset).toBeLessThan(40);
  } else {
    // Mobile reserves space above the bottom navigation bar.
    expect(bottomOffset).toBeGreaterThanOrEqual(70);
  }

  await expectNoBlockingA11yViolations(
    page,
    '[data-testid="cookie-consent-banner"]'
  );
});

test('the banner adapts to dark mode', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'));
  await page.goto('/vi');

  const banner = page.getByTestId('cookie-consent-banner');
  await expect(banner).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);

  const background = await banner.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  );
  expect(background).toBe('rgb(23, 25, 35)');

  await expectNoBlockingA11yViolations(
    page,
    '[data-testid="cookie-consent-banner"]'
  );
});
