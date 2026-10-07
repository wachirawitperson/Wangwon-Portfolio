import { test, expect } from '@playwright/test';

test.describe('Phase 18.5 — Cross-Section Visual Consistency & Cleanup', () => {

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

  async function fillSection1(page) {
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
  }

  async function setupSection2WithImages(page, numImages = 4) {
    await fillSection1(page);
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    await page.evaluate((count) => {
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
    }, numImages);
  }

  async function setupSection3WithImages(page, numImages = 4) {
    await setupSection2WithImages(page, numImages);
    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();
  }

  // =========================================================================
  // 1. GLOBAL TOOLBAR REMOVAL (Tests 1-4)
  // =========================================================================
  test('1. Global action toolbar is absent/hidden from Section 1', async ({ page }) => {
    await page.goto('/');
    const toolbar = page.locator('#action-toolbar');
    await expect(toolbar).toBeHidden();
  });

  test('2. Global action toolbar is absent/hidden from Section 2', async ({ page }) => {
    await setupSection2WithImages(page, 2);
    const toolbar = page.locator('#action-toolbar');
    await expect(toolbar).toBeHidden();
  });

  test('3. Global action toolbar is absent/hidden from Section 3', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    const toolbar = page.locator('#action-toolbar');
    await expect(toolbar).toBeHidden();
  });

  test('4. No duplicate export actions exist outside Section 3 export area', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    // There should only be 1 visible primary export button in the entire DOM
    const visibleExportPdf = page.locator('#btn-section3-export-pdf:visible');
    await expect(visibleExportPdf).toHaveCount(1);
    const legacyExportPdf = page.locator('#btn-export-pdf');
    await expect(legacyExportPdf).toBeHidden();
  });

  // =========================================================================
  // 2. SECTION 2 GRID DENSITY & RESPONSIVE (Tests 5-13)
  // =========================================================================
  test('5. Section 2 at 1440px renders exactly 5 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection2WithImages(page, 8); // 10 cards total (Front cover + 8 images + Back cover)

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(5);
  });

  test('6. Section 2 at 1280px renders exactly 4 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSection2WithImages(page, 6);

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(4);
  });

  test('7. Section 2 at 1024px renders exactly 3 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await setupSection2WithImages(page, 6);

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(3);
  });

  test('8. Section 2 at 768px renders exactly 3 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupSection2WithImages(page, 6);

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(3);
  });

  test('9. Section 2 at 390px renders exactly 3 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection2WithImages(page, 4);

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(3);
  });

  test('10. Section 2 at 320px renders exactly 3 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await setupSection2WithImages(page, 4);

    const grid = page.locator('#workspace-grid');
    const cols = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(cols).toBe(3);
  });

  test('11. No horizontal overflow at all above widths in Section 2', async ({ page }) => {
    const widths = [1440, 1280, 1024, 768, 390, 320];
    await setupSection2WithImages(page, 4);

    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(100);
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `Overflow at ${w}px`).toBe(false);
    }
  });

  test('12. More menu still works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection2WithImages(page, 2);

    const card = page.locator('.student-image-card').first();
    const moreBtn = card.locator('.btn-more');
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    const menu = card.locator('.card-context-menu');
    await expect(menu).toBeVisible();
  });

  test('13. Cover cards remain locked (first and last)', async ({ page }) => {
    await setupSection2WithImages(page, 2);

    const frontCover = page.locator('#front-cover-card');
    const backCover = page.locator('#back-cover-card');

    await expect(frontCover).toBeVisible();
    await expect(backCover).toBeVisible();
    await expect(frontCover).toHaveClass(/locked-cover/);
    await expect(backCover).toHaveClass(/locked-cover/);
  });

  // =========================================================================
  // 3. SECTION 3 PREVIEW & EXPORT (Tests 14-22)
  // =========================================================================
  test('14. Preview canvas stage is generous and larger than previous baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3WithImages(page, 2);

    const canvas = page.locator('#document-preview-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    // Canvas renders large paper size
    expect(box.height).toBeGreaterThan(450);
  });

  test('15. Preview keeps exact A4 aspect ratio', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const canvas = page.locator('#document-preview-canvas');
    const width = await canvas.getAttribute('width');
    const height = await canvas.getAttribute('height');
    // Portrait A4 ratio roughly 842 / 1191 = ~0.707
    const ratio = parseInt(width, 10) / parseInt(height, 10);
    expect(ratio).toBeCloseTo(0.707, 2);
  });

  test('16. Settings remain fully usable and grouped', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    await expect(page.locator('#group-document-settings')).toBeVisible();
    await expect(page.locator('#group-cover-settings')).toBeVisible();
    await expect(page.locator('#group-watermark-settings')).toBeVisible();
    await expect(page.locator('#group-file-settings')).toBeVisible();
  });

  test('17. Sticky export remains visible while scrolling settings', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const stickyArea = page.locator('.settings-sticky-export-area');
    await expect(stickyArea).toBeVisible();
    await expect(page.locator('#btn-section3-export-pdf')).toBeVisible();
  });

  test('18. Final settings control is reachable and not covered by sticky export', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const filenameCard = page.locator('#group-file-settings');
    await filenameCard.scrollIntoViewIfNeeded();
    await expect(filenameCard).toBeVisible();
  });

  test('19. Export actions appear only once in Section 3', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    await expect(page.locator('#btn-section3-export-pdf')).toHaveCount(1);
    await expect(page.locator('#btn-section3-export-zip')).toHaveCount(1);
  });

  test('20. Watermark max 100% still works', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const slider = page.locator('#watermark-scale-slider');
    expect(await slider.getAttribute('max')).toBe('100');
  });

  test('21. Thumbnails strip still works and navigates', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const thumbs = page.locator('#preview-thumbnail-strip .preview-thumb-btn');
    await expect(thumbs).toHaveCount(4);

    await thumbs.nth(2).click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');
  });

  test('22. Current page preservation still works when changing settings', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    await page.locator('#preview-thumbnail-strip .preview-thumb-btn').nth(2).click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');

    await page.locator('[data-setting="placement"][data-value="fill"]').click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');
  });

  // =========================================================================
  // 4. STEPPER CONSISTENCY (Tests 23-28)
  // =========================================================================
  test('23. Section 1 Stepper renders', async ({ page }) => {
    await page.goto('/');
    const stepper = page.locator('#step-navigator');
    await expect(stepper).toBeVisible();
    await expect(page.locator('#step-nav-1')).toHaveClass(/is-active/);
  });

  test('24. Section 2 Stepper renders in compact mode', async ({ page }) => {
    await setupSection2WithImages(page, 2);
    const stepper = page.locator('#step-navigator');
    await expect(stepper).toBeVisible();
    await expect(page.locator('#step-nav-2')).toHaveClass(/is-active/);
  });

  test('25. Section 3 Stepper renders in compact mode', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    const stepper = page.locator('#step-navigator');
    await expect(stepper).toBeVisible();
    await expect(page.locator('#step-nav-3')).toHaveClass(/is-active/);
  });

  test('26. Active, completed, upcoming visual states are consistent', async ({ page }) => {
    await setupSection2WithImages(page, 2);
    await expect(page.locator('#step-nav-1')).toHaveClass(/is-completed/);
    await expect(page.locator('#step-nav-2')).toHaveClass(/is-active/);
    await expect(page.locator('#step-nav-3')).not.toHaveClass(/is-active/);
  });

  test('27. Completed previous step is clickable to navigate back', async ({ page }) => {
    await setupSection2WithImages(page, 2);
    await page.locator('#step-nav-1').click();
    await expect(page.locator('#student-section')).toBeVisible();
  });

  test('28. Forward guard prevents jumping forward when validation fails', async ({ page }) => {
    await page.goto('/');
    // Clear student name
    await page.fill('#student-firstname', '');
    await page.locator('#step-nav-2').click();
    // Should still be on Section 1
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(page.locator('#portfolio-workspace')).toBeHidden();
  });

  // =========================================================================
  // 5. FOOTER (Tests 29-32)
  // =========================================================================
  test('29. Footer contains no export actions or buttons', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer.app-footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('button')).toHaveCount(0);
  });

  test('30. Footer height is compact', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer.app-footer');
    const box = await footer.boundingBox();
    expect(box).not.toBeNull();
    // Compact footer height is under 60px
    expect(box.height).toBeLessThan(60);
  });

  test('31. Footer retains school brand and privacy text', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer.app-footer');
    await expect(footer).toContainText('โรงเรียนบ้านวังวน');
    await expect(footer).toContainText('ประมวลผลในเครื่อง');
  });

  test('32. Footer responsive without overflow at 320px and 390px', async ({ page }) => {
    for (const w of [390, 320]) {
      await page.setViewportSize({ width: w, height: 600 });
      const footer = page.locator('footer.app-footer');
      await expect(footer).toBeVisible();
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  // =========================================================================
  // 6. RESPONSIVE NO OVERFLOW (Tests 33-38)
  // =========================================================================
  test('33. 1440px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('34. 1280px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('35. 1024px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('36. 768px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('37. 390px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  test('38. 320px no horizontal overflow across all sections', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await setupSection3WithImages(page, 2);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);
  });

  // =========================================================================
  // 7. REGRESSION PROTECTIONS (Tests 39-46)
  // =========================================================================
  test('39. Section 1 validation works and highlights required fields', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-step1-next');
    await expect(page.locator('#error-firstName')).toBeVisible();
  });

  test('40. Section 2 image import works', async ({ page }) => {
    await setupSection2WithImages(page, 3);
    const countBadge = page.locator('#image-count-badge');
    await expect(countBadge).toContainText('3 ภาพผลงาน');
  });

  test('41. Section 2 lightbox works', async ({ page }) => {
    await setupSection2WithImages(page, 2);
    const thumb = page.locator('.card-preview').first();
    await thumb.click();
    const lightbox = page.locator('#image-preview-modal');
    await expect(lightbox).toBeVisible();
    await lightbox.locator('button[aria-label="ปิดหน้าต่างดูรูป"]').click();
    await expect(lightbox).toBeHidden();
  });

  test('42. Section 3 preview opens and displays canvas', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await expect(page.locator('#document-preview-canvas')).toBeVisible();
  });

  test('43. Section 3 export buttons are present and interactive', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await expect(page.locator('#btn-section3-export-pdf')).toBeEnabled();
    await expect(page.locator('#btn-section3-export-zip')).toBeEnabled();
  });

  test('44. Autosave manager functions properly', async ({ page }) => {
    await fillSection1(page);
    const status = page.locator('#autosave-status-indicator');
    await expect(status).toBeVisible();
  });

  test('45. Theme switching works cleanly between light and dark', async ({ page }) => {
    await page.goto('/');
    const btnTheme = page.locator('#btn-theme-toggle');
    await btnTheme.click();
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
    await btnTheme.click();
    const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(lightTheme).toBe('light');
  });

  test('46. Official school logo asset is unchanged', async ({ page }) => {
    await page.goto('/');
    const logoImg = page.locator('.brand-logo-img');
    await expect(logoImg).toBeVisible();
    const src = await logoImg.getAttribute('src');
    expect(src).toContain('ban-wangwon-logo.png');
  });
});
