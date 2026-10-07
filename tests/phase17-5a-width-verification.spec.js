import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 17.5A — Section 1 Desktop Width & Spacing Verification', () => {

  const screenshotDir = path.resolve('tests/screenshots');
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  test('1. Verify dimensions, side margins, and capture screenshots', async ({ page }) => {
    // 1440px Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill sample student data for clear visual inspection
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'วัฒนากุลชัย');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '14');
    await page.fill('#student-year', '2569');

    const metrics1440 = await page.evaluate(() => {
      const hero = document.querySelector('.hero-inner').getBoundingClientRect();
      const main = document.querySelector('.main-content').getBoundingClientRect();
      const sec1 = document.querySelector('#student-section').getBoundingClientRect();
      const photoCard = document.querySelector('#student-photo-card').getBoundingClientRect();
      const infoCard = document.querySelector('#student-edit-card').getBoundingClientRect();
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

      return {
        viewportWidth: window.innerWidth,
        heroWidth: Math.round(hero.width),
        mainWidth: Math.round(main.width),
        sec1Width: Math.round(sec1.width),
        sec1Left: Math.round(sec1.left),
        sec1RightMargin: Math.round(window.innerWidth - sec1.right),
        photoCardWidth: Math.round(photoCard.width),
        infoCardWidth: Math.round(infoCard.width),
        hasOverflow: overflow
      };
    });

    console.log('1440px Metrics:', JSON.stringify(metrics1440, null, 2));
    expect(metrics1440.hasOverflow).toBe(false);
    expect(metrics1440.sec1Width).toBeGreaterThan(1280); // Proves container widened!
    expect(metrics1440.sec1Left).toBeLessThan(70); // Proves side margins reduced!

    await page.screenshot({
      path: path.join(screenshotDir, 'phase17-5-section1-width-desktop-1440.png'),
      fullPage: false
    });

    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);

    const metrics1280 = await page.evaluate(() => {
      const hero = document.querySelector('.hero-inner').getBoundingClientRect();
      const main = document.querySelector('.main-content').getBoundingClientRect();
      const sec1 = document.querySelector('#student-section').getBoundingClientRect();
      const photoCard = document.querySelector('#student-photo-card').getBoundingClientRect();
      const infoCard = document.querySelector('#student-edit-card').getBoundingClientRect();
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;

      return {
        viewportWidth: window.innerWidth,
        heroWidth: Math.round(hero.width),
        mainWidth: Math.round(main.width),
        sec1Width: Math.round(sec1.width),
        sec1Left: Math.round(sec1.left),
        sec1RightMargin: Math.round(window.innerWidth - sec1.right),
        photoCardWidth: Math.round(photoCard.width),
        infoCardWidth: Math.round(infoCard.width),
        hasOverflow: overflow
      };
    });

    console.log('1280px Metrics:', JSON.stringify(metrics1280, null, 2));
    expect(metrics1280.hasOverflow).toBe(false);
    expect(metrics1280.sec1Left).toBeLessThanOrEqual(25); // Proves side gutters are clean and compact!

    await page.screenshot({
      path: path.join(screenshotDir, 'phase17-5-section1-width-desktop-1280.png'),
      fullPage: false
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);

    const metrics768 = await page.evaluate(() => {
      const sec1 = document.querySelector('#student-section').getBoundingClientRect();
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return {
        viewportWidth: window.innerWidth,
        sec1Width: Math.round(sec1.width),
        hasOverflow: overflow
      };
    });

    console.log('768px Metrics:', JSON.stringify(metrics768, null, 2));
    expect(metrics768.hasOverflow).toBe(false);

    await page.screenshot({
      path: path.join(screenshotDir, 'phase17-5-section1-width-tablet-768.png'),
      fullPage: false
    });
  });

  test('2. Strict Zero Overflow across all viewports', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const width of [1440, 1280, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(100);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });

  test('3. Section 2 remains constrained to 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill and go to Section 2
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'พัฒนาสุข');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-year', '2569');
    await page.click('#btn-step1-next');

    const sec2 = page.locator('#portfolio-workspace');
    await expect(sec2).toBeVisible();

    const sec2Metrics = await page.evaluate(() => {
      const ws = document.querySelector('#workspace-layout-container').getBoundingClientRect();
      return {
        width: Math.round(ws.width)
      };
    });

    console.log('Section 2 Metrics at 1440px:', sec2Metrics);
    expect(sec2Metrics.width).toBeLessThanOrEqual(1280);
  });
});
