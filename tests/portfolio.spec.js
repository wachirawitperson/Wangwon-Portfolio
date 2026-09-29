import { test, expect } from '@playwright/test';

test.describe('Wangwon Portfolio - Phase 1 Smoke Tests', () => {

  test('1. Page loads successfully and 2. Has no uncaught JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (exception) => {
      jsErrors.push(exception.message);
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(jsErrors).toEqual([]);
  });

  test('3. Header appears with branding and privacy indicator', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header.app-header');
    await expect(header).toBeVisible();

    const title = header.locator('.app-title');
    await expect(title).toHaveText('Wangwon Portfolio');

    const subtitle = header.locator('.app-subtitle');
    await expect(subtitle).toContainText('โรงเรียนบ้านวังวน');

    const privacyBadge = header.locator('.privacy-badge');
    await expect(privacyBadge).toBeVisible();
    await expect(privacyBadge).toContainText('100% ประมวลผลในเครื่อง');
  });

  test('4. Student form appears with required fields and live filename badge', async ({ page }) => {
    await page.goto('/');

    const form = page.locator('#student-info-form');
    await expect(form).toBeVisible();

    await expect(page.locator('#student-prefix')).toBeVisible();
    await expect(page.locator('#student-firstname')).toBeVisible();
    await expect(page.locator('#student-lastname')).toBeVisible();
    await expect(page.locator('#student-grade')).toBeVisible();
    await expect(page.locator('#student-number')).toBeVisible();
    await expect(page.locator('#student-year')).toBeVisible();

    // Verify live filename updating
    const filenameBadge = page.locator('#preview-filename-badge');
    await expect(filenameBadge).toBeVisible();

    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'ใจดี');
    await expect(filenameBadge).toHaveText('ด.ช.สมชาย_ใจดี.pdf');
  });

  test('5. Front cover placeholder exists and is locked at page 1', async ({ page }) => {
    await page.goto('/');

    const frontCover = page.locator('#front-cover-card');
    await expect(frontCover).toBeVisible();

    const lockedBadge = frontCover.locator('.locked-badge');
    await expect(lockedBadge).toContainText('หน้า 1: ปกหน้า (ล็อค)');

    // Ensure school tag and template selector exist
    await expect(frontCover.locator('.cover-school-tag')).toHaveText('โรงเรียนบ้านวังวน');
    await expect(frontCover.locator('#front-template-select')).toBeVisible();
  });

  test('6. Back cover placeholder exists and is locked at last page', async ({ page }) => {
    await page.goto('/');

    const backCover = page.locator('#back-cover-card');
    await expect(backCover).toBeVisible();

    const lockedBadge = backCover.locator('.locked-badge');
    await expect(lockedBadge).toContainText('ปกหลัง (ล็อค)');
    await expect(backCover.locator('#back-template-select')).toBeVisible();
  });

  test('7. Add-image action exists and is accessible', async ({ page }) => {
    await page.goto('/');

    const addAction = page.locator('#btn-add-images');
    await expect(addAction).toBeVisible();

    const uploadInput = page.locator('#file-upload-input');
    await expect(uploadInput).toHaveCount(1);
    await expect(uploadInput).toHaveAttribute('type', 'file');
  });

  test('8. Layout does not overflow mobile viewport (375x667 and 390x844)', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 390, height: 844 }, // iPhone 12/13/14
      { width: 768, height: 1024 }, // iPad Portrait
      { width: 1440, height: 900 } // Desktop
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');

      // Evaluate whether scrollWidth exceeds clientWidth
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll, `Horizontal overflow detected at ${vp.width}x${vp.height}`).toBe(false);
    }
  });

});
