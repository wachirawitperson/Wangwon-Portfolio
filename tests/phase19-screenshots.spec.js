import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase 19 Visual Screenshots', () => {

  const screenshotsDir = path.resolve('tests', 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

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

  async function setupSection3(page, count = 6) {
    await page.goto('/');

    const recoveryModal = page.locator('#recovery-modal');
    if (await recoveryModal.isVisible()) {
      await page.click('#btn-recovery-discard');
      const discardModal = page.locator('#discard-draft-modal');
      if (await discardModal.isVisible()) {
        await page.click('#btn-confirm-discard-draft');
        await expect(discardModal).toBeHidden();
      }
    }

    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');

    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    await page.evaluate((c) => {
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const items = [];
      for (let i = 1; i <= c; i++) {
        items.push({
          id: `img-activity-${i}`,
          file: new File(['mock'], `activity_${String(i).padStart(2, '0')}.png`, { type: 'image/png' }),
          previewUrl: samplePng,
          name: `activity_${String(i).padStart(2, '0')}.png`,
          originalFilename: `activity_${String(i).padStart(2, '0')}.png`,
          mimeType: 'image/png',
          width: 800,
          height: 600,
          aspectRatio: 800 / 600,
          rotation: 0
        });
      }
      window.__WANGWON_STORE__?.setState({ images: items });
    }, count);

    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();
    await page.waitForTimeout(300);
  }

  test('Screenshot 1: phase19-section3-edit-current-page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next'); // Go to Page 2
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section3-edit-current-page.png'),
      fullPage: true
    });
  });

  test('Screenshot 2: phase19-section2-target-highlight-desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section2-target-highlight-desktop.png'),
      fullPage: true
    });
  });

  test('Screenshot 3: phase19-section2-target-highlight-tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section2-target-highlight-tablet.png'),
      fullPage: true
    });
  });

  test('Screenshot 4: phase19-section2-target-highlight-mobile-390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section2-target-highlight-mobile-390.png'),
      fullPage: true
    });
  });

  test('Screenshot 5: phase19-section2-target-highlight-mobile-320', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section2-target-highlight-mobile-320.png'),
      fullPage: true
    });
  });

  test('Screenshot 6: phase19-section2-target-final-row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 12);
    await page.fill('#preview-jump-input', '13');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(200);
    await page.click('#btn-preview-edit-page');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-section2-target-final-row.png'),
      fullPage: true
    });
  });

  test('Screenshot 7: phase19-cover-edit-disabled', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 6);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-cover-edit-disabled.png'),
      fullPage: true
    });
  });

  test('Screenshot 8: phase19-dark-mode-highlight', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-dark-mode-highlight.png'),
      fullPage: true
    });
  });

  test('Screenshot 9: phase19-light-mode-highlight', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3(page, 6);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase19-light-mode-highlight.png'),
      fullPage: true
    });
  });

});
