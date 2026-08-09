import { expect, test, type Page } from '@playwright/test';

const authState = {
  state: {
    user: {
      id: 'newsfeed-player',
      email: 'player@example.com',
      name: 'Newsfeed Player',
      role: 'PLAYER',
    },
    accessToken: 'e2e-access-token',
    refreshToken: 'e2e-refresh-token',
    isAuthenticated: true,
  },
  version: 0,
};

async function initializeAuthenticatedUser(page: Page) {
  await page.addInitScript((state) => {
    window.localStorage.setItem('auth-storage', JSON.stringify(state));
  }, authState);
}

async function mockNewsfeedBase(page: Page) {
  await page.route('**/feature-flags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  );
  await page.route('**/posts/feed?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        posts: [],
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false,
      }),
    })
  );
}

test('does not request discovery data below the wide desktop breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1439, height: 900 });
  await initializeAuthenticatedUser(page);
  await mockNewsfeedBase(page);

  let discoveryRequestCount = 0;
  await page.route('**/sessions/suggestions?**', (route) => {
    discoveryRequestCount += 1;
    return route.abort();
  });
  await page.route('**/clubs?**', (route) => {
    discoveryRequestCount += 1;
    return route.abort();
  });

  await page.goto('/vi/newsfeed');
  await expect(page.getByText('Chưa có bài viết nào')).toBeVisible();
  await expect(
    page.locator('[data-slot="newsfeed-discovery-rail"]')
  ).toBeHidden();
  await page.waitForTimeout(300);

  expect(discoveryRequestCount).toBe(0);
  await expect(page.locator('[data-slot="newsfeed-feed-column"]')).toHaveCSS(
    'max-width',
    '720px'
  );
});

test('shows personalized sessions and nearby clubs at 1440px', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await initializeAuthenticatedUser(page);
  await mockNewsfeedBase(page);
  await context.addCookies([
    {
      name: 'user-location',
      value: '10.776,106.701',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  let sessionQuery = '';
  let clubQuery = '';
  await page.route('**/sessions/suggestions?**', (route) => {
    sessionQuery = new URL(route.request().url()).search;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: 'session-1',
              slug: 'morning-session',
              name: 'Kèo sáng cuối tuần',
              hostId: 'host-1',
              host: { id: 'host-1', name: 'Host', email: 'host@example.com' },
              numberOfCourts: 2,
              maxPlayersPerCourt: 4,
              sessionDuration: 120,
              requirePlayerInfo: false,
              status: 'PUBLISHED',
              startTime: '2026-08-10T01:00:00.000Z',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
              venue: { id: 'venue-1', name: 'Sân Trung Tâm' },
              availableSlots: 3,
              distance: 1.2,
              matchReasons: ['nearby'],
              score: 10,
            },
          ],
          pagination: { page: 1, limit: 3, total: 1 },
        },
      }),
    });
  });
  await page.route('**/clubs?**', (route) => {
    clubQuery = new URL(route.request().url()).search;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              id: 'club-1',
              slug: 'nearby-club',
              name: 'Nhóm cầu lông gần nhà',
              joinPolicy: 'OPEN',
              memberCount: 24,
              host: { id: 'host-1', name: 'Host' },
              status: 'APPROVED',
              createdAt: '2026-08-01T00:00:00.000Z',
              location: 'Quận 1',
              distance: 0.8,
            },
          ],
          total: 1,
          page: 1,
          limit: 3,
          totalPages: 1,
        },
      }),
    });
  });

  await page.goto('/vi/newsfeed');

  const rail = page.locator('[data-slot="newsfeed-discovery-rail"]');
  await expect(rail).toBeVisible();
  await expect(rail.getByText('Kèo dành cho bạn')).toBeVisible();
  await expect(rail.getByText('Nhóm gần bạn')).toBeVisible();
  await expect(
    rail.getByRole('link', { name: 'Xem kèo Kèo sáng cuối tuần' })
  ).toHaveAttribute('href', '/vi/sessions/morning-session');
  await expect(
    rail.getByRole('link', { name: 'Xem nhóm Nhóm cầu lông gần nhà' })
  ).toHaveAttribute('href', '/vi/clubs/nearby-club');

  expect(sessionQuery).toContain('lat=10.776');
  expect(sessionQuery).toContain('lng=106.701');
  expect(sessionQuery).toContain('limit=3');
  expect(clubQuery).toContain('lat=10.776');
  expect(clubQuery).toContain('lng=106.701');
  expect(clubQuery).toContain('sortBy=distance');
  expect(clubQuery).toContain('sortOrder=asc');

  const layoutMetrics = await page
    .locator('[data-slot="newsfeed-discovery-layout"]')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        columnGap: style.columnGap,
        columns: style.gridTemplateColumns,
        display: style.display,
        width: element.getBoundingClientRect().width,
      };
    });
  expect(layoutMetrics.display).toBe('grid');
  expect(layoutMetrics.columnGap).toBe('24px');
  expect(layoutMetrics.columns).toBe('720px 320px');
  expect(layoutMetrics.width).toBe(1064);
  await expect(rail).toHaveCSS('position', 'sticky');
  await expect(rail).toHaveCSS('top', '72px');
});

test('uses preferred city and recenters when both sections are unavailable', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await initializeAuthenticatedUser(page);
  await mockNewsfeedBase(page);
  await context.addCookies([
    {
      name: 'preferred-city',
      value: 'HCM',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  let clubQuery = '';
  await page.route('**/sessions/suggestions?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 3, total: 0 },
        },
      }),
    })
  );
  await page.route('**/clubs?**', (route) => {
    clubQuery = new URL(route.request().url()).search;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 3, totalPages: 0 },
      }),
    });
  });

  await page.goto('/vi/newsfeed');
  await expect(
    page.locator('[data-slot="newsfeed-discovery-rail"]')
  ).toBeHidden();
  await expect(
    page.locator('[data-slot="newsfeed-discovery-layout"]')
  ).toHaveCSS('max-width', '720px');
  const clubParams = new URLSearchParams(clubQuery);
  expect(clubParams.get('city')).toBe('Hồ Chí Minh');
  expect(clubParams.get('sortBy')).toBe('relevance');
  expect(clubParams.get('sortOrder')).toBe('desc');
});

test('keeps the available section when the other discovery request fails', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await initializeAuthenticatedUser(page);
  await mockNewsfeedBase(page);

  let sessionQuery = '';
  let clubQuery = '';
  await page.route('**/sessions/suggestions?**', (route) => {
    sessionQuery = new URL(route.request().url()).search;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: 'session-fallback',
              slug: 'fallback-session',
              name: 'Kèo gợi ý không cần vị trí',
              hostId: 'host-1',
              host: { id: 'host-1', name: 'Host', email: 'host@example.com' },
              numberOfCourts: 1,
              maxPlayersPerCourt: 4,
              sessionDuration: 120,
              requirePlayerInfo: false,
              status: 'PUBLISHED',
              createdAt: '2026-08-01T00:00:00.000Z',
              updatedAt: '2026-08-01T00:00:00.000Z',
              availableSlots: 2,
              distance: null,
              matchReasons: [],
              score: 5,
            },
          ],
          pagination: { page: 1, limit: 3, total: 1 },
        },
      }),
    });
  });
  await page.route('**/clubs?**', (route) => {
    clubQuery = new URL(route.request().url()).search;
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Unavailable' }),
    });
  });

  await page.goto('/vi/newsfeed');

  const rail = page.locator('[data-slot="newsfeed-discovery-rail"]');
  await expect(rail.getByText('Kèo dành cho bạn')).toBeVisible();
  await expect(rail.getByText('Nhóm gần bạn')).toHaveCount(0);
  await expect(rail.getByText('Nhóm gợi ý')).toHaveCount(0);

  const sessionParams = new URLSearchParams(sessionQuery);
  const clubParams = new URLSearchParams(clubQuery);
  expect(sessionParams.has('lat')).toBe(false);
  expect(sessionParams.has('lng')).toBe(false);
  expect(clubParams.has('city')).toBe(false);
  expect(clubParams.get('sortBy')).toBe('relevance');
  expect(clubParams.get('sortOrder')).toBe('desc');
});
