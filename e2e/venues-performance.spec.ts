import { expect, test } from '@playwright/test';

// Run against a production server with VENUES_BASE_URL when profiling.
const base = process.env.VENUES_BASE_URL || 'http://127.0.0.1:3100';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'user-preferences',
      JSON.stringify({
        state: {
          preferredCity: null,
          preferredDistricts: [],
          onboardingCompleted: true,
        },
        version: 0,
      })
    );
  });
  await page.route('**/feature-flags', (route) =>
    route.fulfill({ json: { success: true, data: {} } })
  );
  await page.route('https://res.cloudinary.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="green"/></svg>',
    })
  );
});

function result(page: number, keyword = '') {
  return {
    success: true,
    data: {
      data: Array.from({ length: 12 }, (_, i) => ({
        id: `${keyword}venue-${(page - 1) * 12 + i}`,
        name: `Sân ${keyword} ${(page - 1) * 12 + i}`,
        address: '123 Nguyễn Văn Linh',
        city: 'Hồ Chí Minh',
        coverPhoto: `https://res.cloudinary.com/demo/image/upload/v1/venue-${i}.jpg`,
        openingHours: '06:00–22:00',
        numberOfCourts: 8,
      })),
      pagination: { page, limit: 12, total: 300, totalPages: 25 },
    },
  };
}

test('300 results keep a bounded DOM, sized images and sequential requests', async ({
  page,
}) => {
  const pages: number[] = [];
  const prefetch: string[] = [];
  page.on('request', (r) => {
    if (r.headers()['next-router-prefetch']) prefetch.push(r.url());
  });
  await page.route('**/venues/search?*', async (route) => {
    const p = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(p);
    await route.fulfill({ json: result(p) });
  });
  await page.goto(`${base}/vi/venues?sort=name_asc`);
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  await page.waitForTimeout(800);
  expect(pages).toEqual([1]);
  for (let p = 2; p <= 25; p++) {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await expect(page.locator('[data-venue-list]')).toHaveAttribute(
      'data-loaded-count',
      String(p * 12)
    );
  }
  expect(pages).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  expect(await page.locator('[data-venue-id]').count()).toBeLessThan(40);
  expect(prefetch).toEqual([]);
  const images = await page
    .locator('[data-venue-id] img')
    .evaluateAll((nodes) =>
      nodes.map((n) => ({
        src: (n as HTMLImageElement).src,
        width: n.getAttribute('width'),
        height: n.getAttribute('height'),
      }))
    );
  expect(
    images.every((i) => i.width && i.height && i.src.includes('f_auto'))
  ).toBe(true);
  // Let the virtual range settle after the final page, so the focused card is
  // not a row that is about to be replaced by the post-load range.
  await page.waitForTimeout(500);
  const id = await page.evaluate(
    () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-venue-id]')
      ).find((n) => {
        const rect = n.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      })?.dataset.venueId
  );
  const focused = page.locator(`[data-venue-id="${id}"] [role="link"]`);
  await focused.focus();
  await expect(focused).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(
    page.locator(`[data-venue-id="${id}"] [role="link"]`)
  ).toBeFocused();
});

test('return navigation restores loaded data and scroll position', async ({
  page,
}) => {
  await page.route('**/venues/search?*', async (route) => {
    const p = Number(new URL(route.request().url()).searchParams.get('page'));
    await route.fulfill({ json: result(p) });
  });
  await page.goto(`${base}/vi/venues?sort=name_asc`);
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  for (let p = 2; p <= 4; p++) {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    );
    await expect(page.locator('[data-venue-list]')).toHaveAttribute(
      'data-loaded-count',
      String(p * 12)
    );
  }
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(200);
  await page
    .locator('a[href="/vi/about"]')
    .first()
    .evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/vi\/about$/);
  await page.goBack();
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '48'
  );
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(1400);
});

test('failed next page retains cards and retries the same page', async ({
  page,
}) => {
  let failed = false;
  const pages: number[] = [];
  await page.route('**/venues/search?*', async (route) => {
    const p = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(p);
    if (p === 2 && !failed) {
      failed = true;
      await route.fulfill({ status: 500, json: { success: false } });
      return;
    }
    await route.fulfill({ json: result(p) });
  });
  await page.goto(`${base}/vi/venues?sort=name_asc`);
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await expect(
    page.getByRole('button', { name: 'Thử lại', exact: true })
  ).toBeVisible();
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '24'
  );
  expect(pages).toEqual([1, 2, 2]);
});

test('sidebar cookie controls initial desktop width and legacy migration does not shift it', async ({
  page,
  context,
  isMobile,
}) => {
  await context.addCookies([
    { name: 'sidebar-collapsed', value: 'true', url: base },
  ]);
  await page.route('**/venues/search?*', (r) => r.fulfill({ json: result(1) }));
  await page.goto(`${base}/vi/venues?sort=name_asc`);
  const shell = page.locator('[data-slot="page-wrapper"]');
  if (!isMobile) await expect(shell).toHaveCSS('margin-left', '72px');
  await context.clearCookies();
  await page.addInitScript(() =>
    localStorage.setItem('sidebar-collapsed', 'true')
  );
  await page.reload();
  if (!isMobile) await expect(shell).toHaveCSS('margin-left', '240px');
  await expect
    .poll(
      async () =>
        (await context.cookies()).find((c) => c.name === 'sidebar-collapsed')
          ?.value
    )
    .toBe('true');
});

// SSR fixtures are supplied by INTERNAL_API_URL for the production test run.
test('matching public SSR seed does not fetch page one again', async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.VENUES_SSR_FIXTURE,
    'Requires the local SSR fixture server'
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 10, longitude: 106 });
  await context.addCookies([
    { name: 'user-location', value: '10.000%2C106.000', url: base },
  ]);
  const pages: number[] = [];
  await page.route('**/venues/search?*', async (route) => {
    const p = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(p);
    await route.fulfill({ json: result(p) });
  });
  await page.goto(`${base}/vi/venues`);
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  await page.waitForTimeout(1000);
  expect(pages).toEqual([]);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '24'
  );
  expect(pages).toEqual([2]);
});

test('an empty SSR result is distinct from a failed SSR fetch', async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.VENUES_SSR_FIXTURE,
    'Requires the local SSR fixture server'
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 0, longitude: 106 });
  await context.addCookies([
    { name: 'user-location', value: '0.000%2C106.000', url: base },
  ]);
  const pages: number[] = [];
  await context.route('**/venues/search?*', async (route) => {
    pages.push(1);
    await route.fulfill({ json: result(1) });
  });
  await page.goto(`${base}/vi/venues`);
  await expect(
    page.getByText('Không tìm thấy sân nào', { exact: true })
  ).toBeVisible();
  expect(pages).toEqual([]);
  await context.setGeolocation({ latitude: -1, longitude: 106 });
  await context.addCookies([
    { name: 'user-location', value: '-1.000%2C106.000', url: base },
  ]);
  // WebKit keeps the previous geolocation override across reload, which would
  // legitimately refetch for the "changed" location. A new page picks it up.
  await page.close();
  const failedSsrPage = await context.newPage();
  await failedSsrPage.goto(`${base}/vi/venues`);
  await expect(failedSsrPage.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  expect(pages).toEqual([1]);
});

test('authenticated seed reconciles once before loading page two', async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.VENUES_SSR_FIXTURE,
    'Requires the local SSR fixture server'
  );
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 10, longitude: 106 });
  await context.addCookies([
    { name: 'user-location', value: '10.000%2C106.000', url: base },
  ]);
  await page.addInitScript(() =>
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: { id: 'fixture-user', name: 'Fixture', role: 'USER' },
          accessToken: 'fixture-token',
          refreshToken: 'fixture-refresh',
          isAuthenticated: true,
        },
        version: 0,
      })
    )
  );
  await page.route('**/api/**', async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/venues/search')) {
      await route.fallback();
      return;
    }
    await route.fulfill({ json: { success: true, data: [] } });
  });
  const pages: number[] = [];
  let active = 0,
    maxActive = 0;
  await page.route('**/venues/search?*', async (route) => {
    const p = Number(new URL(route.request().url()).searchParams.get('page'));
    pages.push(p);
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 250));
    active--;
    await route.fulfill({ json: result(p) });
  });
  await page.goto(`${base}/vi/venues`);
  await expect.poll(() => pages.length).toBe(1);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  // Reaching the end during reconciliation queues page two after it, never in
  // parallel. Standing still afterwards must not chain page three.
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '24'
  );
  await page.waitForTimeout(800);
  expect(pages).toEqual([1, 2]);
  expect(maxActive).toBe(1);
});

test('changing search during a slow request cannot append the old results', async ({
  page,
}) => {
  await page.route('**/venues/search?*', async (route) => {
    const url = new URL(route.request().url()),
      p = Number(url.searchParams.get('page')),
      keyword = url.searchParams.get('keyword') || '';
    if (p === 2) await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      await route.fulfill({ json: result(p, keyword) });
    } catch {
      /* Superseded request was aborted. */
    }
  });
  await page.goto(`${base}/vi/venues?sort=name_asc`);
  await expect(page.locator('[data-venue-list]')).toHaveAttribute(
    'data-loaded-count',
    '12'
  );
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await page
    // Desktop uses the top-bar input; mobile renders its own inline input.
    .locator('input[placeholder="Tìm kiếm sân..."]:visible')
    .first()
    .fill('new');
  await expect(page.locator('[data-venue-id]').first()).toHaveAttribute(
    'data-venue-id',
    /^new/
  );
  await page.waitForTimeout(1300);
  expect(
    await page
      .locator('[data-venue-id]')
      .evaluateAll((nodes) =>
        nodes.every((n) => n.getAttribute('data-venue-id')?.startsWith('new'))
      )
  ).toBe(true);
});
