import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const locales = ['vi', 'en', 'cn'] as const;
const blockingA11yImpacts = new Set(['serious', 'critical']);

async function expectNoBlockingA11yViolations(
  page: import('@playwright/test').Page,
  selector?: string
) {
  let builder = new AxeBuilder({ page }).disableRules(['color-contrast']);
  if (selector) builder = builder.include(selector);
  const accessibilityScanResults = await builder.analyze();
  const blockingViolations = accessibilityScanResults.violations.filter(
    (violation) => violation.impact && blockingA11yImpacts.has(violation.impact)
  );
  expect(blockingViolations).toEqual([]);
}

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
});

for (const theme of ['light', 'dark'] as const) {
  test(`about page ${theme} baseline`, async ({ page }, testInfo) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('theme', selectedTheme);
    }, theme);

    await page.goto('/vi/about');
    await expect(page.locator('html')).toHaveClass(new RegExp(theme));
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    await expectNoBlockingA11yViolations(page);

    await page.screenshot({
      path: testInfo.outputPath(`about-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}

test('locale shells render without horizontal overflow', async ({ page }) => {
  for (const locale of locales) {
    await page.goto(`/${locale}/about`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow, `${locale} overflows horizontally`).toBe(
      false
    );
  }
});

test('about FAQ supports keyboard-accessible disclosure', async ({ page }) => {
  await page.goto('/vi/about');
  const firstQuestion = page.locator('[data-slot="accordion-trigger"]').first();

  await firstQuestion.focus();
  await page.keyboard.press('Enter');

  await expect(firstQuestion).toHaveAttribute('data-state', 'open');
  await expect(
    page.locator('[data-slot="accordion-content"]').first()
  ).toBeVisible();
});

test('phase 2 pages expose semantic content without blocking accessibility issues', async ({
  page,
}) => {
  test.setTimeout(60_000);

  for (const route of ['settings', 'privacy', 'terms']) {
    await page.goto(`/vi/${route}`);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow, `${route} overflows horizontally`).toBe(
      false
    );
    await expectNoBlockingA11yViolations(page);
  }
});

test('phase 3 guide is localized, navigable, and accessible', async ({
  page,
}, testInfo) => {
  for (const locale of locales) {
    await page.goto(`/${locale}/guide`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('nav[aria-labelledby] a')).toHaveCount(7);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(
      hasHorizontalOverflow,
      `${locale} guide overflows horizontally`
    ).toBe(false);
  }

  await page.goto('/vi/guide');
  const sessionsLink = page.locator('a[href="#sessions"]');
  await sessionsLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#sessions$/);
  await expect(page.locator('#sessions')).toBeInViewport();
  await expectNoBlockingA11yViolations(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  await page.screenshot({
    path: testInfo.outputPath('guide-phase-3.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('phase 4 auth surfaces are responsive and accessible', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);

  for (const route of [
    'signin',
    'signup',
    'forgot-password',
    'reset-password',
  ]) {
    await page.goto(`/vi/auth/${route}`);
    await expect(page.locator('main h1')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow, `${route} overflows horizontally`).toBe(
      false
    );
    await expectNoBlockingA11yViolations(page);
  }

  for (const locale of locales) {
    await page.goto(`/${locale}/auth/signin`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toBeVisible();
  }

  for (const route of ['signin', 'signup']) {
    await page.goto(`/vi/auth/${route}`);
    const card = page.locator('[data-slot="auth-card"]');
    const stack = card.locator('.auth-card-stack');
    const firstInput = card.locator('[data-slot="input"]').first();

    await expect(card).toBeVisible();
    const geometry = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        width: element.getBoundingClientRect().width,
        paddingLeft: Number.parseFloat(style.paddingLeft),
      };
    });
    expect(geometry.width).toBeLessThanOrEqual(448);
    expect(geometry.paddingLeft).toBe(32);
    await expect(stack).toHaveCSS('gap', '24px');
    await expect(firstInput).toHaveCSS('padding-left', '12px');

    await page.screenshot({
      path: testInfo.outputPath(`auth-${route}-${testInfo.project.name}.png`),
      animations: 'disabled',
    });
  }
});

test('phase 4 sign-in validation and password visibility work', async ({
  page,
}) => {
  await page.goto('/vi/auth/signin');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('form [role="alert"]')).toHaveCount(2);

  const password = page.getByTestId('password-input');
  await password.fill('secret-password');
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('phase 4 invalid OAuth callback fails safely', async ({ page }) => {
  await page.goto('/cn/auth/callback');
  await expect(page.locator('main [role="alert"]')).toContainText(
    '回调参数无效'
  );
  await expect(page).toHaveURL(/\/cn\/auth\/signin$/, { timeout: 5_000 });
});

test('phase 5 shared shells preserve responsive offsets and scrolling', async ({
  page,
}, testInfo) => {
  await page.goto('/vi/about');
  const pageWrapper = page.locator('[data-slot="page-wrapper"]');
  await expect(pageWrapper).toBeVisible();

  const marginLeft = await pageWrapper.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).marginLeft)
  );
  if (testInfo.project.name === 'desktop-chromium') {
    expect(marginLeft).toBeGreaterThan(0);
  } else {
    expect(marginLeft).toBe(0);
  }

  await page.goto('/vi/auth/signup');
  const layout = page.locator('[data-slot="main-layout"]');
  const scrollContainer = page.locator('[data-slot="main-layout-scroll"]');
  await expect(layout).toBeVisible();
  await expect(scrollContainer).toBeVisible();

  const shellMetrics = await layout.evaluate((element) => ({
    position: getComputedStyle(element).position,
    left: element.getBoundingClientRect().left,
  }));
  const overflowY = await scrollContainer.evaluate(
    (element) => getComputedStyle(element).overflowY
  );
  expect(shellMetrics.position).toBe('fixed');
  expect(overflowY).toBe('auto');
  if (testInfo.project.name === 'desktop-chromium') {
    expect(shellMetrics.left).toBeGreaterThan(0);
  } else {
    expect(shellMetrics.left).toBe(0);
  }

  await expect(page.locator('main h1')).toBeVisible();
  await expectNoBlockingA11yViolations(page);
});

test('phase 5 protected guard redirects anonymous users', async ({ page }) => {
  await page.goto('/vi/newsfeed');
  await expect(page).toHaveURL(/\/vi\/auth\/signin$/, { timeout: 10_000 });
  await expect(page.locator('main h1')).toBeVisible();
});

test('phase 6 top bar preserves responsive navigation interactions', async ({
  page,
}, testInfo) => {
  await page.goto('/vi/about');

  const topBar = page.locator('[data-slot="top-bar"]');
  const menuButton = page.getByRole('button', { name: 'Mở menu' });
  const drawer = page.locator('[data-slot="navigation-drawer"]');

  await expect(topBar).toBeVisible();
  await expect(topBar).toHaveCSS('position', 'fixed');
  await expect(topBar).toHaveCSS('border-bottom-width', '1px');
  await expect(topBar.locator('.top-bar-logo-mark')).toBeVisible();
  const dividerColor = await topBar.evaluate(
    (element) => getComputedStyle(element).borderBottomColor
  );
  expect(dividerColor).not.toBe('rgba(0, 0, 0, 0)');
  await expect(topBar.locator('.top-bar-title-center')).toHaveCSS(
    'font-size',
    testInfo.project.name === 'desktop-chromium' ? '18px' : '16px'
  );
  await expect(menuButton).toBeVisible();
  await expect(drawer).toHaveAttribute('data-state', 'closed');

  if (testInfo.project.name === 'desktop-chromium') {
    const brand = topBar.locator('.top-bar-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toHaveCSS('padding-right', '2px');
    await expect(brand).toHaveCSS('letter-spacing', '-0.36px');
    await expect(brand).toHaveCSS('line-height', '22px');
    await expect(brand).toHaveCSS('font-weight', '800');

    await expect(drawer).toHaveCSS('width', '240px');
    await menuButton.click();
    await expect(drawer).toHaveCSS('width', '72px');
    await expect(page.locator('[data-slot="page-wrapper"]')).toHaveCSS(
      'margin-left',
      '72px'
    );
  } else {
    await menuButton.click();
    await expect(
      page.getByRole('button', { name: 'Đóng menu' }).first()
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('data-state', 'open');

    const overlay = page.locator('[data-slot="navigation-overlay"]');
    await expect(overlay).toBeVisible();
    await overlay.click({ position: { x: 300, y: 100 } });
    await expect(drawer).toHaveAttribute('data-state', 'closed');
    await expect(overlay).toHaveCount(0);
  }

  await expectNoBlockingA11yViolations(page, '[data-slot="top-bar"]');
  await page.screenshot({
    path: testInfo.outputPath(`top-bar-phase-6-${testInfo.project.name}.png`),
    animations: 'disabled',
  });
});

test('phase 6 discovery top bar restores its desktop divider', async ({
  page,
}, testInfo) => {
  await page.goto('/vi');
  const topBar = page.locator('[data-slot="top-bar"]');

  await expect(topBar).toHaveAttribute('data-hide-mobile-border', 'true');
  const dividerColor = await topBar.evaluate(
    (element) => getComputedStyle(element).borderBottomColor
  );
  if (testInfo.project.name === 'desktop-chromium') {
    expect(dividerColor).not.toBe('rgba(0, 0, 0, 0)');
  } else {
    expect(dividerColor).toBe('rgba(0, 0, 0, 0)');
  }

  await page.screenshot({
    path: testInfo.outputPath(
      `discovery-top-bar-divider-${testInfo.project.name}.png`
    ),
    animations: 'disabled',
  });
});

test('sport-tech shell preserves dark-mode surface hierarchy', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'));
  await page.goto('/vi/about');

  const drawer = page.locator('[data-slot="navigation-drawer"]');
  if (testInfo.project.name !== 'desktop-chromium') {
    await page.getByRole('button', { name: 'Mở menu' }).click();
  }
  const activeLink = drawer.locator('[aria-current="page"]').first();
  const activeIcon = activeLink.locator('.sidebar-nav-icon');

  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(activeLink).toBeVisible();
  await expect(activeLink).toHaveCSS('min-height', '44px');
  await expect(activeLink).toHaveCSS('border-radius', '12px');
  await expect(activeIcon).toHaveCSS('width', '32px');

  const surfaces = await page.evaluate(() => {
    const readBackground = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).backgroundColor : null;
    };
    const readRgbBrightness = (selector: string) => {
      const background = readBackground(selector);
      const channels = background
        ?.match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      return channels?.length === 3
        ? channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        : null;
    };
    const topBar = document.querySelector('[data-slot="top-bar"]');
    return {
      topBar: readBackground('[data-slot="top-bar"]'),
      drawer: readBackground('[data-slot="navigation-drawer"]'),
      topBarBrightness: readRgbBrightness('[data-slot="top-bar"]'),
      drawerBrightness: readRgbBrightness('[data-slot="navigation-drawer"]'),
      topBarShadow: topBar ? getComputedStyle(topBar).boxShadow : null,
      accentOpacity: topBar
        ? getComputedStyle(topBar, '::after').opacity
        : null,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  expect(surfaces.topBar).not.toBe('rgba(0, 0, 0, 0)');
  expect(surfaces.drawer).not.toBe('rgba(0, 0, 0, 0)');
  expect(surfaces.topBarBrightness).not.toBeNull();
  expect(surfaces.drawerBrightness).not.toBeNull();
  expect(surfaces.topBarBrightness!).toBeGreaterThan(
    surfaces.drawerBrightness!
  );
  expect(surfaces.topBarShadow).not.toBe('none');
  expect(surfaces.accentOpacity).toBe('0.62');
  expect(surfaces.overflow).toBe(false);

  await expectNoBlockingA11yViolations(page);
  await page.screenshot({
    path: testInfo.outputPath(
      `sport-tech-shell-dark-${testInfo.project.name}.png`
    ),
    animations: 'disabled',
  });
});

test('phase 7 sidebar preserves accessible collapsed and mobile interactions', async ({
  page,
}, testInfo) => {
  await page.goto('/vi/about');

  const drawer = page.locator('[data-slot="navigation-drawer"]');
  const menuButton = page.getByRole('button', { name: 'Mở menu' });
  const firstNavLink = drawer.locator('.sidebar-nav-link').first();

  if (testInfo.project.name === 'desktop-chromium') {
    await expect(firstNavLink).toHaveCSS('font-size', '15px');
    await expect(firstNavLink).toHaveCSS('line-height', '20px');
    await expect(firstNavLink).toHaveCSS('font-weight', '500');

    await menuButton.click();
    await expect(drawer).toHaveAttribute('data-collapsed', 'true');
    await expect(
      drawer.getByRole('button', { name: /^Ngôn ngữ:/ })
    ).toBeVisible();
    await expect(
      drawer.getByRole('button', { name: /^Giao diện:/ })
    ).toBeVisible();

    await firstNavLink.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await expectNoBlockingA11yViolations(page);
  } else {
    await menuButton.click();
    await expect(drawer).toHaveAttribute('data-state', 'open');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Đóng menu' })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="navigation-overlay"]')
    ).toBeVisible();
    await expect(firstNavLink).toHaveCSS('font-size', '15px');
    await expect(firstNavLink).toHaveCSS('line-height', '20px');
    await expectNoBlockingA11yViolations(page);
    await page.screenshot({
      path: testInfo.outputPath('sidebar-phase-7-mobile-open.png'),
      animations: 'disabled',
    });

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('data-state', 'closed');

    await menuButton.click();
    await page.locator('[data-slot="navigation-overlay"]').click({
      position: { x: 300, y: 100 },
    });
    await expect(drawer).toHaveAttribute('data-state', 'closed');
  }

  await page.screenshot({
    path: testInfo.outputPath(`sidebar-phase-7-${testInfo.project.name}.png`),
    animations: 'disabled',
  });
});

test('sidebar session primitives preserve disclosure and collapsed flyout', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: 'e2e-player',
            email: 'player@example.com',
            name: 'E2E Player',
            role: 'HOST',
          },
          accessToken: 'e2e-access-token',
          refreshToken: 'e2e-refresh-token',
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  });
  const isDesktop = testInfo.project.name === 'desktop-chromium';
  await page.goto(isDesktop ? '/vi/host/sessions' : '/vi/about');

  const drawer = page.locator('[data-slot="navigation-drawer"]');
  if (!isDesktop) {
    await page.locator('.top-bar-menu-button').click();
  }

  const sessionsTrigger = drawer.getByRole('button', {
    name: 'Kèo',
    exact: true,
  });
  await expect(sessionsTrigger).toHaveAttribute(
    'aria-expanded',
    isDesktop ? 'true' : 'false'
  );
  if (isDesktop) {
    await sessionsTrigger.click();
    await expect(sessionsTrigger).toHaveAttribute('aria-expanded', 'false');
  }
  await sessionsTrigger.click();
  await expect(sessionsTrigger).toHaveAttribute('aria-expanded', 'true');
  if (isDesktop) {
    await expect(sessionsTrigger).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
    const parentIndicator = await sessionsTrigger.evaluate(
      (element) => getComputedStyle(element, '::before').content
    );
    expect(parentIndicator).toBe('none');
  }
  const manageSessionsLink = drawer.getByRole('link', { name: 'Quản lý kèo' });
  await expect(manageSessionsLink).toBeVisible();
  await expect(manageSessionsLink).toHaveCSS(
    'min-height',
    isDesktop ? '38px' : '44px'
  );
  const submenuLabelStyle = await manageSessionsLink
    .locator('span')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    });
  expect(submenuLabelStyle).toEqual({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });
  const activeConnector = await manageSessionsLink.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return { width: style.width, height: style.height };
  });
  expect(activeConnector).toEqual({
    width: '10px',
    height: isDesktop ? '2px' : '1px',
  });

  if (isDesktop) {
    await expect(manageSessionsLink).toHaveAttribute('data-active', 'true');
    await expect(manageSessionsLink).toHaveCSS('font-weight', '600');
    const activeStyles = await manageSessionsLink.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(activeStyles.backgroundImage).not.toBe('none');
    expect(activeStyles.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(activeStyles.boxShadow).not.toBe('none');
  }

  if (isDesktop) {
    await page.locator('.top-bar-menu-button').click();
    await expect(drawer).toHaveAttribute('data-collapsed', 'true');
    const collapsedSessionsTrigger = drawer.getByRole('button', {
      name: 'Kèo',
      exact: true,
    });
    await collapsedSessionsTrigger.focus();
    await expect(page.locator('.sidebar-session-flyout')).toBeVisible();
  }

  await expectNoBlockingA11yViolations(
    page,
    '[data-slot="navigation-drawer"], .sidebar-session-flyout'
  );
});

test('empty result state preserves migrated responsive surface styles', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'user-preferences',
      JSON.stringify({
        state: {
          preferredCity: 'HCM',
          preferredDistricts: [],
          onboardingCompleted: true,
        },
        version: 0,
      })
    );
  });
  await page.context().addCookies([
    {
      name: 'preferred-city',
      value: 'HCM',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
  await page.route('**/venues/search?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        },
      }),
    })
  );

  await page.goto('/vi/venues?q=__e2e_empty_result__');

  const emptyState = page.locator('[data-slot="app-empty-state"]');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveCSS('border-style', 'dashed');
  await expect(emptyState).toHaveCSS('border-width', '2px');
  await expect(emptyState).toHaveCSS('border-color', 'rgb(226, 232, 240)');
  await expect(emptyState).toHaveCSS('border-radius', '16px');
  await expect(emptyState).toHaveCSS(
    'background-image',
    'linear-gradient(rgb(250, 250, 250) 0%, rgb(245, 245, 245) 100%)'
  );

  await expectNoBlockingA11yViolations(page, '[data-slot="app-empty-state"]');
  await page.screenshot({
    path: testInfo.outputPath(
      `empty-result-responsive-${testInfo.project.name}.png`
    ),
    animations: 'disabled',
  });
});

test('sidebar Radix menus preserve keyboard selection and locale queries', async ({
  page,
}, testInfo) => {
  await page.goto('/vi/about?sidebar=e2e');

  if (testInfo.project.name !== 'desktop-chromium') {
    await page.locator('.top-bar-menu-button').click();
  }

  await page.getByRole('button', { name: /^Ngôn ngữ:/ }).click();
  const englishOption = page.getByRole('menuitemradio', { name: 'English' });
  await expect(englishOption).toBeVisible();
  await englishOption.press('Enter');
  await expect(page).toHaveURL(/\/en\/about\?sidebar=e2e$/);

  if (testInfo.project.name !== 'desktop-chromium') {
    await page.locator('.top-bar-menu-button').click();
  }

  await page.getByRole('button', { name: /^Theme:/ }).click();
  const darkOption = page.getByRole('menuitemradio', { name: 'Dark Mode' });
  await expect(darkOption).toBeVisible();
  await darkOption.press('Enter');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('theme')))
    .toBe('dark');

  await expectNoBlockingA11yViolations(page);
});

test('sidebar typography handles all supported locales without overflow', async ({
  page,
}, testInfo) => {
  for (const locale of ['vi', 'en', 'cn']) {
    await page.goto(`/${locale}/about`);

    if (testInfo.project.name !== 'desktop-chromium') {
      await page.locator('.top-bar-menu-button').click();
    }

    const drawer = page.locator('[data-slot="navigation-drawer"]');
    await expect(drawer).toBeVisible();
    const typography = await drawer.evaluate((element) => {
      const labels = Array.from(
        element.querySelectorAll<HTMLElement>(
          '.sidebar-nav-label, .sidebar-session-label, .sidebar-switcher-label'
        )
      );
      return {
        hasHorizontalOverflow: element.scrollWidth > element.clientWidth,
        labelsUseSingleLineTruncation: labels.every((label) => {
          const style = getComputedStyle(label);
          return (
            style.overflow === 'hidden' &&
            style.textOverflow === 'ellipsis' &&
            style.whiteSpace === 'nowrap'
          );
        }),
      };
    });
    expect(typography.hasHorizontalOverflow).toBe(false);
    expect(typography.labelsUseSingleLineTruncation).toBe(true);

    await page.screenshot({
      path: testInfo.outputPath(
        `sidebar-typography-${locale}-${testInfo.project.name}.png`
      ),
      animations: 'disabled',
    });
  }
});
