import { expect, test, type Page } from '@playwright/test';

const user = {
  id: 'leaderboard-player',
  email: 'player@example.com',
  name: 'Người chơi thử nghiệm',
  role: 'PLAYER',
};

const authState = {
  state: {
    user,
    accessToken: 'e2e-access-token',
    refreshToken: 'e2e-refresh-token',
    isAuthenticated: true,
  },
  version: 0,
};

const leaderboardEntries = [
  {
    rank: 1,
    points: 202,
    user: {
      id: 'player-1',
      name: 'Minh Tuấn',
      image: null,
      level: 4,
    },
    tier: 'GOLD',
    totalPoints: 1720,
    matchesWon: 12,
    matchesPlayed: 16,
  },
  {
    rank: 2,
    points: 177,
    user: { id: 'player-2', name: 'ShuAh V', image: null, level: 3 },
    tier: 'SILVER',
    totalPoints: 1265,
    matchesWon: 11,
    matchesPlayed: 20,
  },
  {
    rank: 3,
    points: 139,
    user: { id: 'player-3', name: 'Ray Loff', image: null, level: 2 },
    tier: 'SILVER',
    totalPoints: 883,
    matchesWon: 9,
    matchesPlayed: 15,
  },
];

async function initializeAuthenticatedUser(page: Page) {
  await page.addInitScript((state) => {
    window.localStorage.setItem('auth-storage', JSON.stringify(state));
  }, authState);
}

async function mockBase(page: Page) {
  await page.route('**/feature-flags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  );
}

async function mockLeaderboard(
  page: Page,
  options: { isCurrentPeriod?: boolean } = {}
) {
  await page.route(/\/api\/leaderboard(?:\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sport: 'badminton',
          period: 'week',
          board: 'player',
          periodKey: options.isCurrentPeriod === false ? '2026-W30' : null,
          periodStart: '2026-08-03T00:00:00.000Z',
          periodEnd: '2026-08-10T00:00:00.000Z',
          isCurrentPeriod: options.isCurrentPeriod ?? true,
          page: 1,
          limit: 20,
          total: leaderboardEntries.length,
          totalPages: 1,
          entries: leaderboardEntries,
        },
      }),
    })
  );
}

function mockAchievements(page: Page, onRequest?: () => void) {
  return page.route('**/leaderboard/users/*/achievements', (route) => {
    onRequest?.();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          sport: 'badminton',
          totalPoints: 900,
          hostPoints: 0,
          tier: 'SILVER',
          nextTier: { nextTier: 'GOLD', pointsToNext: 600 },
          ranks: [{ period: 'week', rank: 42, points: 37 }],
          stats: {
            wins: 4,
            draws: 1,
            losses: 3,
            matchesPlayed: 8,
            sessionsPlayed: 5,
            sessionsHosted: 0,
            tournamentTitles: 0,
            tournamentRunnerUps: 0,
          },
          recentTransactions: [],
        },
      }),
    });
  });
}

test('keeps the centered leaderboard and skips achievements below 1440px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1439, height: 900 });
  await initializeAuthenticatedUser(page);
  await mockBase(page);
  await mockLeaderboard(page);

  let achievementRequests = 0;
  await mockAchievements(page, () => {
    achievementRequests += 1;
  });

  await page.goto('/vi/leaderboard');
  await expect(page.getByText('Minh Tuấn')).toBeVisible();
  await expect(
    page.locator('[data-slot="leaderboard-context-rail"]')
  ).toBeHidden();
  await page.waitForTimeout(300);

  expect(achievementRequests).toBe(0);
  await expect(
    page.locator('[data-slot="leaderboard-context-layout"]')
  ).toHaveCSS('max-width', '640px');
});

test('shows the personal progress and scoring guide at 1440px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await initializeAuthenticatedUser(page);
  await mockBase(page);
  await mockLeaderboard(page);

  let achievementRequests = 0;
  await mockAchievements(page, () => {
    achievementRequests += 1;
  });

  await page.goto('/vi/leaderboard');

  const rail = page.locator('[data-slot="leaderboard-context-rail"]');
  await expect(rail).toBeVisible();
  await expect(rail.getByText('Vị trí của bạn')).toBeVisible();
  await expect(rail.getByText('#42')).toBeVisible();
  await expect(rail.getByText('37')).toBeVisible();
  await expect(rail.getByText('Cách kiếm điểm')).toBeVisible();
  await expect(
    rail.getByRole('progressbar', { name: 'Tiến độ tới hạng tiếp theo' })
  ).toHaveAttribute('aria-valuenow', '40');
  expect(achievementRequests).toBe(1);

  const layoutMetrics = await page
    .locator('[data-slot="leaderboard-context-layout"]')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        columnGap: style.columnGap,
        columns: style.gridTemplateColumns,
        display: style.display,
        width: element.getBoundingClientRect().width,
      };
    });
  expect(layoutMetrics).toEqual({
    columnGap: '24px',
    columns: '640px 320px',
    display: 'grid',
    width: 984,
  });
  await expect(rail).toHaveCSS('position', 'sticky');
  await expect(rail).toHaveCSS('top', '72px');

  await rail.getByRole('button', { name: 'Cách tính điểm' }).click();
  await expect(page.getByText('Cách tính điểm & xếp hạng')).toBeVisible();
});

test('does not present the current rank as a historical-period rank', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await initializeAuthenticatedUser(page);
  await mockBase(page);
  await mockLeaderboard(page, { isCurrentPeriod: false });
  await mockAchievements(page);

  await page.goto('/vi/leaderboard?period=week&periodKey=2026-W30');

  const rail = page.locator('[data-slot="leaderboard-context-rail"]');
  await expect(rail.getByText('#42')).toHaveCount(0);
  await expect(
    rail.getByText('Chưa có hạng của bạn trong trang kết quả này.')
  ).toBeVisible();
});

test('shows the scoring guide without requesting achievements for guests', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBase(page);
  await mockLeaderboard(page);

  let achievementRequests = 0;
  await mockAchievements(page, () => {
    achievementRequests += 1;
  });

  await page.goto('/vi/leaderboard');

  const rail = page.locator('[data-slot="leaderboard-context-rail"]');
  await expect(rail.getByText('Vị trí của bạn')).toHaveCount(0);
  await expect(rail.getByText('Cách kiếm điểm')).toBeVisible();
  await expect(
    rail.getByRole('link', { name: 'Tìm kèo ngay' })
  ).toHaveAttribute('href', '/vi');
  expect(achievementRequests).toBe(0);
});
