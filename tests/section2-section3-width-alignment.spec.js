import { test, expect } from '@playwright/test';

test.describe('Section 2 / Section 3 Outer Frame Width Alignment Verification', () => {

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

  async function populateStudentDataAndImages(page, count = 6) {
    await page.goto('/');
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
          id: `img-${i}`,
          file: new File(['mock'], `img_${i}.png`, { type: 'image/png' }),
          previewUrl: samplePng,
          name: `img_${i}.png`,
          originalFilename: `img_${i}.png`,
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

  test('Outer container widths match exactly between Section 2 and Section 3 at 1440px and 1280px', async ({ page }) => {
    for (const viewportWidth of [1440, 1280]) {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      await populateStudentDataAndImages(page, 6);

      // Measure Section 2 outer container width
      const sec2Width = await page.locator('#workspace-layout-container').evaluate((el) => {
        return Math.round(el.getBoundingClientRect().width);
      });

      // Navigate to Section 3
      await page.click('#btn-step2-next');
      await expect(page.locator('#section-review-export')).toBeVisible();

      // Measure Section 3 outer container width
      const sec3Width = await page.locator('#section-review-export').evaluate((el) => {
        return Math.round(el.getBoundingClientRect().width);
      });

      console.log(`[Viewport ${viewportWidth}px] Section 2 Width: ${sec2Width}px, Section 3 Width: ${sec3Width}px`);
      // Widths must match within 2px tolerance (due to scrollbar / subpixel rendering)
      expect(Math.abs(sec2Width - sec3Width), `Width difference at ${viewportWidth}px`).toBeLessThanOrEqual(2);
    }
  });

  test('Preserves Section 2 5/4/3/3 card rules across viewports', async ({ page }) => {
    await populateStudentDataAndImages(page, 8);

    const expectations = [
      { width: 1440, expectedCols: 5 },
      { width: 1280, expectedCols: 4 },
      { width: 1024, expectedCols: 3 },
      { width: 768, expectedCols: 3 },
      { width: 390, expectedCols: 3 },
      { width: 320, expectedCols: 3 }
    ];

    for (const { width, expectedCols } of expectations) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(100);

      const cols = await page.locator('#workspace-grid').evaluate((grid) => {
        return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      });

      console.log(`[Viewport ${width}px] Expected ${expectedCols} columns, got ${cols}`);
      expect(cols).toBe(expectedCols);

      // Check no horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Overflow at ${width}px`).toBe(false);
    }
  });

});
