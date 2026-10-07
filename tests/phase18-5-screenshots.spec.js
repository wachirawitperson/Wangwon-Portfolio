import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 18.5 — Visual QA Screenshots', () => {
  const screenshotsDir = path.resolve('tests/screenshots');

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

  async function setupSection1(page) {
    await page.goto('/');
    const recoveryModal = page.locator('#recovery-modal');
    if (await recoveryModal.isVisible()) {
      await page.click('#btn-recovery-discard');
      const discardModal = page.locator('#discard-draft-modal');
      if (await discardModal.isVisible()) {
        await page.click('#btn-confirm-discard-draft');
      }
    }
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');
  }

  async function populateImages(page, count) {
    await page.evaluate((c) => {
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const items = [];
      for (let i = 1; i <= c; i++) {
        items.push({
          id: `img-sample-${i}`,
          file: new File(['mock'], `activity_${String(i).padStart(2, '0')}.png`, { type: 'image/png' }),
          previewUrl: samplePng,
          name: `activity_${String(i).padStart(2, '0')}.png`,
          mimeType: 'image/png',
          width: 800,
          height: 600,
          aspectRatio: 800 / 600,
          rotation: 0
        });
      }
      window.__WANGWON_STORE__?.setState({ images: items });
    }, count);
  }

  test('Capture all 15 required screenshots', async ({ page }) => {
    test.setTimeout(60000);

    // 1. phase18-5-section1-desktop.png
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection1(page);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section1-desktop.png'), fullPage: true });

    // Go to Section 2 and add 5 images
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await populateImages(page, 5);
    await page.waitForTimeout(300);

    // 2. phase18-5-section2-desktop-5cols.png
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section2-desktop-5cols.png'), fullPage: true });

    // 3. phase18-5-section2-1280-4cols.png
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section2-1280-4cols.png'), fullPage: true });

    // 4. phase18-5-section2-tablet-3cols.png
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section2-tablet-3cols.png'), fullPage: true });

    // 5. phase18-5-section2-mobile-390-3cols.png
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section2-mobile-390-3cols.png'), fullPage: true });

    // 6. phase18-5-section2-mobile-320-3cols.png
    await page.setViewportSize({ width: 320, height: 600 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section2-mobile-320-3cols.png'), fullPage: true });

    // Go to Section 3
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();
    await page.waitForTimeout(500);

    // 7. phase18-5-section3-desktop.png
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section3-desktop.png'), fullPage: true });

    // 8. phase18-5-section3-preview-large.png
    const previewStage = page.locator('#document-canvas-stage');
    await previewStage.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section3-preview-large.png') });

    // 9. phase18-5-section3-mobile-390.png
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section3-mobile-390.png'), fullPage: true });

    // 10. phase18-5-section3-mobile-320.png
    await page.setViewportSize({ width: 320, height: 600 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-section3-mobile-320.png'), fullPage: true });

    // 11. phase18-5-footer-compact.png
    await page.setViewportSize({ width: 1440, height: 900 });
    const footer = page.locator('.app-footer');
    await footer.screenshot({ path: path.join(screenshotsDir, 'phase18-5-footer-compact.png') });

    // 12. phase18-5-stepper-consistency.png
    const stepper = page.locator('#step-navigator');
    await stepper.screenshot({ path: path.join(screenshotsDir, 'phase18-5-stepper-consistency.png') });

    // 13. phase18-5-dark-mode-section1.png
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.click('#btn-step3-prev');
    await page.click('#btn-step2-prev');
    await expect(page.locator('#student-section')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-dark-mode-section1.png'), fullPage: true });

    // 14. phase18-5-dark-mode-section2.png
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-dark-mode-section2.png'), fullPage: true });

    // 15. phase18-5-dark-mode-section3.png
    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-5-dark-mode-section3.png'), fullPage: true });
  });
});
