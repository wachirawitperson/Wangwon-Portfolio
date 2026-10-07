import { test, expect } from '@playwright/test';

test.describe('Phase 18.6 — Student Photo Clickable Dropzone', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB) {
          const req = indexedDB.deleteDatabase('wangwon_portfolio_db');
          await new Promise((resolve) => {
            req.onsuccess = resolve;
            req.onerror = resolve;
            req.onblocked = resolve;
          });
        }
      } catch (e) {}
    });
  });

  const samplePhoto = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const samplePhoto2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9Qz8DAwM8AAA/cA/90vGxkAAAAAElFTkSuQmCC', 'base64');

  test('1. Empty photo frame click opens file chooser', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    await expect(frame).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await frame.click();
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('2. Empty photo frame tap works on Mobile Chrome', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    await expect(frame).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    if (isMobile) {
      await frame.tap();
    } else {
      await frame.click();
    }
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('3. Existing "เลือกรูปถ่าย" button still opens file chooser', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#btn-upload-student-photo');
    await expect(btn).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await btn.click();
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('4. Uploaded photo appears correctly (4:5, object-fit cover, placeholder hidden)', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    const input = page.locator('#student-photo-input');
    const placeholder = page.locator('#student-photo-placeholder');
    const previewImg = page.locator('#student-photo-preview-img');

    await input.setInputFiles({
      name: 'student_1.png',
      mimeType: 'image/png',
      buffer: samplePhoto
    });

    await expect(placeholder).toBeHidden();
    await expect(previewImg).toBeVisible();
    await expect(frame).toHaveClass(/has-photo/);

    const fit = await previewImg.evaluate((el) => getComputedStyle(el).objectFit);
    expect(fit).toBe('cover');
  });

  test('5. Clicking filled photo frame opens replace flow via file chooser', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    const input = page.locator('#student-photo-input');

    await input.setInputFiles({
      name: 'initial.png',
      mimeType: 'image/png',
      buffer: samplePhoto
    });
    await expect(page.locator('#student-photo-preview-img')).toBeVisible();

    // Now click the photo frame directly to replace
    const fileChooserPromise = page.waitForEvent('filechooser');
    await frame.click();
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();

    await fileChooser.setFiles({
      name: 'replacement.png',
      mimeType: 'image/png',
      buffer: samplePhoto2
    });

    await expect(page.locator('#student-photo-preview-img')).toBeVisible();
    await expect(page.locator('#btn-upload-student-photo')).toHaveText(/เปลี่ยนรูป/);
  });

  test('6. Keyboard Enter on photo frame opens file chooser', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    await frame.focus();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('7. Keyboard Space on photo frame opens file chooser', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    await frame.focus();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Space');
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeTruthy();
  });

  test('8. Photo remains optional for proceeding to Section 2', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');

    // Without photo, click Next
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
  });

  test('9. Student photo does not enter activity images in Section 2', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#student-photo-input');
    await input.setInputFiles({
      name: 'student_photo.png',
      mimeType: 'image/png',
      buffer: samplePhoto
    });

    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');

    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // Verify activity cards count is 0
    await expect(page.locator('.student-image-card')).toHaveCount(0);
    const countBadge = page.locator('#image-count-badge');
    await expect(countBadge).toContainText('0 ภาพผลงาน');
  });

  test('10. No horizontal overflow at 320px and 390px', async ({ page }) => {
    for (const w of [390, 320]) {
      await page.setViewportSize({ width: w, height: 750 });
      await page.goto('/');
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow at ${w}px`).toBe(false);
    }
  });

  test('11. Accessible attributes and visual state change when photo is loaded', async ({ page }) => {
    await page.goto('/');
    const frame = page.locator('#student-photo-preview-wrap');
    await expect(frame).toHaveAttribute('role', 'button');
    await expect(frame).toHaveAttribute('tabindex', '0');
    await expect(frame).toHaveAttribute('aria-label', /เลือกรูปถ่ายนักเรียน/);

    const input = page.locator('#student-photo-input');
    await input.setInputFiles({
      name: 'student_avatar.png',
      mimeType: 'image/png',
      buffer: samplePhoto
    });

    await expect(frame).toHaveAttribute('aria-label', /เปลี่ยนรูปถ่ายนักเรียน/);
  });

});
