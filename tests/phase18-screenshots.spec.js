import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase 18 Visual QA Screenshots Capture', () => {
  const screenshotsDir = path.resolve('tests/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  async function setupSection3WithImages(page, numImages = 4) {
    await page.evaluate((count) => {
      // Set student info
      window.__WANGWON_STORE__?.setState({
        student: {
          prefix: 'ด.ช.',
          firstName: 'สมชาย',
          lastName: 'รักเรียน',
          grade: 'ประถมศึกษาปีที่ 6',
          studentNumber: '12',
          academicYear: '2569'
        }
      });

      // Set images
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const items = [];
      for (let i = 1; i <= count; i++) {
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

      // Navigate to Section 3
      window.__WANGWON_NAVIGATION__?.goToSection(3, { skipValidation: true });
    }, numImages);

    await expect(page.locator('#section-review-export')).toBeVisible();
    await page.waitForTimeout(600); // Allow canvas to render
  }

  test('Capture all 16 Phase 18 Visual QA artifacts', async ({ page }) => {
    await page.goto('/');
    // 1. Desktop Light (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3WithImages(page, 4);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-desktop-light-1440.png'), fullPage: false });

    // 2. Desktop Dark (1440x900)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-desktop-dark-1440.png'), fullPage: false });

    // Reset to light
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

    // 3. Desktop 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-desktop-1280.png'), fullPage: false });

    // 4. Page 1 (Front Cover)
    await page.locator('#document-preview-pane').screenshot({
      path: path.join(screenshotsDir, 'phase18-page-1-cover.png')
    });

    // 5. Navigate to Activity page
    await page.locator('#btn-preview-page-next').click();
    await page.waitForTimeout(400);
    await page.locator('#document-preview-pane').screenshot({
      path: path.join(screenshotsDir, 'phase18-page-2-activity.png')
    });

    // 6. Navigate to Back cover
    await page.locator('#preview-jump-input').fill('6');
    await page.locator('#btn-preview-jump-go').click();
    await page.waitForTimeout(400);
    await page.locator('#document-preview-pane').screenshot({
      path: path.join(screenshotsDir, 'phase18-page-back-cover.png')
    });

    // 7. Thumbnail strip
    await page.locator('#preview-thumbnail-strip').screenshot({
      path: path.join(screenshotsDir, 'phase18-thumbnail-strip.png')
    });

    // 8. Settings panel
    await page.locator('#settings-panel').screenshot({
      path: path.join(screenshotsDir, 'phase18-settings-panel.png')
    });

    // 9. Watermark OFF
    await page.locator('#group-watermark-settings').screenshot({
      path: path.join(screenshotsDir, 'phase18-watermark-off.png')
    });

    // 10. Watermark ON with options
    await page.locator('#setting-watermark-enabled').check();
    await page.waitForTimeout(300);
    await page.locator('#group-watermark-settings').screenshot({
      path: path.join(screenshotsDir, 'phase18-watermark-on.png')
    });

    // 11. Watermark 100% scale
    await page.locator('#watermark-scale-slider').fill('100');
    await page.locator('#watermark-scale-slider').dispatchEvent('input');
    await page.waitForTimeout(200);
    await page.locator('#group-watermark-settings').screenshot({
      path: path.join(screenshotsDir, 'phase18-watermark-scale-100.png')
    });

    // 12. Sticky export area
    await page.locator('.settings-sticky-export-area').screenshot({
      path: path.join(screenshotsDir, 'phase18-sticky-export-area.png')
    });

    // 13. Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-tablet-768.png'), fullPage: false });

    // 14. Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-mobile-390.png'), fullPage: false });

    // 15. Mobile 320x568
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase18-mobile-320.png'), fullPage: false });

    // 16. 50 Images Performance thumbnail strip
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3WithImages(page, 50);
    await page.screenshot({
      path: path.join(screenshotsDir, 'phase18-50-images-workspace.png'),
      fullPage: false
    });
  });
});
