import { expect, test, type Page } from '@playwright/test';

const authState = {
  state: {
    user: {
      id: 'post-author',
      email: 'author@example.com',
      name: 'Post Author',
      role: 'PLAYER',
    },
    accessToken: 'e2e-access-token',
    refreshToken: 'e2e-refresh-token',
    isAuthenticated: true,
  },
  version: 0,
};

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

async function prepareNewsfeed(page: Page) {
  await page.addInitScript((state) => {
    window.localStorage.setItem('auth-storage', JSON.stringify(state));
  }, authState);

  await page.route('https://vmito.com/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    })
  );
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

test('creates a post with inline clipboard previews and ordered images', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(
    testInfo.project.name === 'desktop-chromium'
      ? { width: 1200, height: 900 }
      : { width: 390, height: 844 }
  );
  await prepareNewsfeed(page);

  let uploadCount = 0;
  await page.route('**/user-images?category=OTHER', async (route) => {
    uploadCount += 1;
    const imageNumber = uploadCount;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: `image-${imageNumber}`,
          userId: 'post-author',
          url: `https://example.com/image-${imageNumber}.png`,
          publicId: `public-${imageNumber}`,
          category: 'OTHER',
        },
      }),
    });
  });

  let createPostPayload: {
    content: string;
    images: Array<{ publicId: string; order: number }>;
  } | null = null;
  await page.route('**/posts', async (route) => {
    createPostPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { id: 'new-post' } }),
    });
  });

  await page.goto('/vi/newsfeed');
  await page
    .locator('[data-slot="newsfeed-feed-column"]')
    .locator('[role="button"][aria-label="Tạo bài viết"]')
    .click();

  const dialog = page.getByRole('dialog', { name: 'Tạo bài viết' });
  const textarea = dialog.getByRole('textbox', { name: 'Nội dung bài viết' });
  await expect(dialog).toBeVisible();
  await expect(textarea).toHaveCSS('border-top-width', '1px');
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');
  const mainLayoutScroll = page.locator('.main-layout-scroll');
  if ((await mainLayoutScroll.count()) > 0) {
    await expect(mainLayoutScroll).toHaveCSS('overflow-y', 'hidden');
  }

  const initialHeight = await textarea.evaluate(
    (element) => element.clientHeight
  );
  const content = Array.from({ length: 14 }, (_, index) =>
    index === 0
      ? 'Xem thêm tại https://example.com/event'
      : `Nội dung dòng ${index + 1}`
  ).join('\n');
  await textarea.fill(content);
  await expect(
    dialog.locator('a[href="https://example.com/event"]')
  ).toHaveCount(0);
  await expect(textarea).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  await expect
    .poll(() => textarea.evaluate((element) => element.clientHeight))
    .toBeGreaterThan(initialHeight);
  await expect
    .poll(() =>
      textarea.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1
      )
    )
    .toBe(true);

  await dialog.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  const discardDialog = page.getByRole('dialog', {
    name: 'Bỏ bài viết đang soạn?',
  });
  await expect(discardDialog).toBeVisible();
  await discardDialog
    .getByRole('button', { name: 'Tiếp tục chỉnh sửa' })
    .click();
  await expect(discardDialog).toBeHidden();
  await expect(textarea).toHaveValue(content);
  await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');

  await dialog.getByRole('button', { name: 'Đóng hộp thoại' }).click();
  await discardDialog.getByRole('button', { name: 'Bỏ bài viết' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('html')).not.toHaveCSS('overflow-y', 'hidden');
  await expect(page.locator('body')).not.toHaveCSS('overflow-y', 'hidden');
  if ((await mainLayoutScroll.count()) > 0) {
    await expect(mainLayoutScroll).not.toHaveCSS('overflow-y', 'hidden');
  }

  await page
    .locator('[data-slot="newsfeed-feed-column"]')
    .locator('[role="button"][aria-label="Tạo bài viết"]')
    .click();
  await expect(dialog).toBeVisible();
  await expect(textarea).toHaveValue('');
  await textarea.fill(content);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await dialog.getByRole('button', { name: 'Thêm hình ảnh' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([
    { name: 'first.png', mimeType: 'image/png', buffer: tinyPng },
    { name: 'second.png', mimeType: 'image/png', buffer: tinyPng },
  ]);

  await expect(
    dialog.getByRole('button', { name: 'Đang tải hình ảnh...' })
  ).toBeDisabled();
  await expect(dialog.getByAltText('Ảnh xem trước 1')).toBeVisible();
  await expect(dialog.getByAltText('Ảnh xem trước 2')).toBeVisible();
  const firstPreviewUrl = await dialog
    .getByAltText('Ảnh xem trước 1')
    .getAttribute('src');
  const keptImageNumber = firstPreviewUrl?.match(/image-(\d+)\.png/)?.[1];
  expect(keptImageNumber).toBeTruthy();
  await expect(
    dialog.getByRole('button', { name: 'Tải ảnh mới', exact: true })
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('button', { name: 'Chọn từ thư viện', exact: true })
  ).toBeVisible();
  await expect(dialog.getByText('Thêm hình ảnh', { exact: true })).toHaveCount(
    0
  );

  await textarea.evaluate(
    (element, pngBytes) => {
      const transfer = new DataTransfer();
      transfer.setData('text/plain', (element as HTMLTextAreaElement).value);
      transfer.items.add(
        new File([new Uint8Array(pngBytes)], 'clipboard.png', {
          type: 'image/png',
        })
      );
      element.dispatchEvent(
        new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: transfer,
        })
      );
    },
    [...tinyPng]
  );

  await expect(dialog.getByAltText('Ảnh xem trước 3')).toBeVisible();
  await expect(textarea).toHaveValue(content);

  await dialog.getByRole('button', { name: 'Xóa ảnh 2' }).click();
  await expect(dialog.getByAltText('Ảnh xem trước 3')).toHaveCount(0);

  const secondReorderHandle = dialog.getByRole('button', {
    name: 'Sắp xếp lại ảnh 2',
  });
  await secondReorderHandle.focus();
  await page.keyboard.press('Space');
  await expect(secondReorderHandle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Space');
  await expect(dialog.getByAltText('Ảnh xem trước 1')).toHaveAttribute(
    'src',
    /image-3\.png/
  );

  await dialog.getByRole('button', { name: 'Đăng' }).click();
  await expect(dialog).toBeHidden();
  expect(createPostPayload).toMatchObject({
    content,
    images: [
      { publicId: 'public-3', order: 0 },
      { publicId: `public-${keptImageNumber}`, order: 1 },
    ],
  });
});
