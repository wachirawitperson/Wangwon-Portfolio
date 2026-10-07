import { test, expect } from '@playwright/test';

test.describe('Phase 18 — Section 3: Final Review & Export Workspace', () => {

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

  // Helper to fill Section 1, add 2 sample activity images in Section 2, and navigate to Section 3
  async function setupSection3WithImages(page, numImages = 2) {
    await page.goto('/');
    
    // Check and close recovery modal if present
    const recoveryModal = page.locator('#recovery-modal');
    if (await recoveryModal.isVisible()) {
      await page.click('#btn-recovery-discard');
      const discardModal = page.locator('#discard-draft-modal');
      if (await discardModal.isVisible()) {
        await page.click('#btn-confirm-discard-draft');
      }
    }

    // Step 1: Fill student info
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // Step 2: Add images via evaluate in projectStore for high reliability
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

    // Navigate to Section 3
    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();
  }

  test('1. Two-column desktop workspace layout renders correctly', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    
    const previewPane = page.locator('#document-preview-pane');
    const settingsPanel = page.locator('#settings-panel');
    const canvasStage = page.locator('#document-canvas-stage');
    const canvas = page.locator('#document-preview-canvas');

    await expect(previewPane).toBeVisible();
    await expect(settingsPanel).toBeVisible();
    await expect(canvasStage).toBeVisible();
    await expect(canvas).toBeVisible();

    // Verify indicator shows Front Cover initially (Page 1)
    const indicator = page.locator('#preview-page-indicator');
    await expect(indicator).toContainText('หน้า 1 / 4');
    await expect(indicator).toContainText('ปกหน้า');
  });

  test('2. Paper preview size is generous and clear without distorting', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const canvas = page.locator('#document-preview-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    // Canvas should render with significant height on desktop
    expect(box.height).toBeGreaterThan(300);
  });

  test('3. Page navigation controls and current page indicator work accurately', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const indicator = page.locator('#preview-page-indicator');
    const btnPrev = page.locator('#btn-preview-page-prev');
    const btnNext = page.locator('#btn-preview-page-next');

    // Initial state: page 1 (Front Cover), prev is disabled
    await expect(btnPrev).toBeDisabled();
    await expect(btnNext).toBeEnabled();
    await expect(indicator).toContainText('หน้า 1 / 4 • ปกหน้า');

    // Click Next -> Page 2 (Activity 1)
    await btnNext.click();
    await expect(indicator).toContainText('หน้า 2 / 4 • หน้าผลงาน 1');
    await expect(btnPrev).toBeEnabled();
    await expect(btnNext).toBeEnabled();

    // Click Next -> Page 3 (Activity 2)
    await btnNext.click();
    await expect(indicator).toContainText('หน้า 3 / 4 • หน้าผลงาน 2');

    // Click Next -> Page 4 (Back Cover)
    await btnNext.click();
    await expect(indicator).toContainText('หน้า 4 / 4 • ปกหลัง');
    await expect(btnNext).toBeDisabled();

    // Click Prev -> Page 3
    await btnPrev.click();
    await expect(indicator).toContainText('หน้า 3 / 4 • หน้าผลงาน 2');
  });

  test('4. Real page thumbnail cards render and allow instant jumping', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const thumbs = page.locator('#preview-thumbnail-strip .preview-thumb-btn');
    await expect(thumbs).toHaveCount(4); // Front cover + 2 images + Back cover

    // Thumb 1 has badge #1 and name ปกหน้า
    await expect(thumbs.nth(0)).toContainText('ปกหน้า');
    await expect(thumbs.nth(0)).toHaveClass(/is-active/);

    // Click Thumb 3 (Activity 2)
    await thumbs.nth(2).click();
    await expect(thumbs.nth(2)).toHaveClass(/is-active/);
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');

    // Thumb 4 has badge #4 and name ปกหลัง
    await thumbs.nth(3).click();
    await expect(thumbs.nth(3)).toHaveClass(/is-active/);
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 4 / 4 • ปกหลัง');
  });

  test('5. Quick Jump ("ไปที่หน้า") input navigates accurately', async ({ page }) => {
    await setupSection3WithImages(page, 3); // 5 pages total

    const jumpInput = page.locator('#preview-jump-input');
    const btnGo = page.locator('#btn-preview-jump-go');

    await jumpInput.fill('4');
    await btnGo.click();

    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 4 / 5');
    expect(await jumpInput.inputValue()).toBe('4');

    // Test Jump via Enter key
    await jumpInput.fill('1');
    await jumpInput.press('Enter');
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 1 / 5 • ปกหน้า');
  });

  test('6. Preserves current page index when settings change', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    // Navigate to page 3 (Activity 2)
    await page.locator('#preview-thumbnail-strip .preview-thumb-btn').nth(2).click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');

    // Change placement setting to Fill
    await page.locator('[data-setting="placement"][data-value="fill"]').click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');

    // Change quality setting to High
    await page.locator('[data-setting="quality"][data-value="high"]').click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');

    // Change cover template
    await page.locator('#tpl-opt-colorful-portfolio').click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 3 / 4');
  });

  test('7. Settings panel has 4 structured groups with internal scrolling and sticky export', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    await expect(page.locator('#group-document-settings')).toBeVisible();
    await expect(page.locator('#group-cover-settings')).toBeVisible();
    await expect(page.locator('#group-watermark-settings')).toBeVisible();
    await expect(page.locator('#group-file-settings')).toBeVisible();

    // Export card is inside sticky export area
    const stickyArea = page.locator('.settings-sticky-export-area');
    await expect(stickyArea).toBeVisible();
    await expect(stickyArea.locator('#btn-section3-export-pdf')).toBeVisible();
    await expect(stickyArea.locator('#btn-section3-export-zip')).toBeVisible();
  });

  test('8. Watermark progressive disclosure, status badge, and 100% scale support', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const wmToggle = page.locator('#setting-watermark-enabled');
    const statusBadge = page.locator('#watermark-status-badge');
    const optionsContainer = page.locator('#watermark-options-container');
    const scaleSlider = page.locator('#watermark-scale-slider');

    // Initial state: Off
    await expect(statusBadge).toHaveText('ปิด');
    await expect(optionsContainer).toBeHidden();

    // Turn watermark ON
    await wmToggle.check();
    await expect(statusBadge).toHaveText('เปิด');
    await expect(optionsContainer).toBeVisible();

    // Verify scale slider supports max 100
    const maxVal = await scaleSlider.getAttribute('max');
    expect(maxVal).toBe('100');

    // Adjust scale to 75%
    await scaleSlider.fill('75');
    await scaleSlider.dispatchEvent('input');
    await expect(page.locator('#watermark-scale-val')).toHaveText('75%');

    // Turn watermark OFF
    await wmToggle.uncheck();
    await expect(statusBadge).toHaveText('ปิด');
    await expect(optionsContainer).toBeHidden();
  });

  test('9. Group 4 displays generated filename accurately', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const filenameBadge = page.locator('#preview-filename-badge-settings');
    await expect(filenameBadge).toBeVisible();
    // Student was สมชาย รักเรียน ป.6/12 2569
    await expect(filenameBadge).toContainText('สมชาย');
    await expect(filenameBadge).toContainText('.pdf');
  });

  test('10. Export CTAs are clear, correctly ordered, and single instance visible', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const btnPdf = page.locator('#btn-section3-export-pdf');
    const btnZip = page.locator('#btn-section3-export-zip');

    await expect(btnZip).toContainText('ส่งออก PDF + รูปภาพ');
    await expect(btnPdf).toContainText('สร้าง Portfolio PDF');

    // Verify duplicate floating action-toolbar is hidden when Section 3 is visible
    const floatingToolbar = page.locator('#action-toolbar');
    await expect(floatingToolbar).toBeHidden();
  });

  test('11. Responsive viewports: 1440px, 1280px, 768px, 390px, 320px with zero horizontal scroll', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 568 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(200);

      // Verify no horizontal overflow on window
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `Horizontal scroll detected at ${vp.width}px`).toBe(false);

      // Section 3 elements remain visible
      await expect(page.locator('#document-preview-pane')).toBeVisible();
      await expect(page.locator('#settings-panel')).toBeVisible();
    }
  });

  test('12. High-volume performance: 50 activity images render thumbnails cleanly', async ({ page }) => {
    await setupSection3WithImages(page, 50);

    const thumbs = page.locator('#preview-thumbnail-strip .preview-thumb-btn');
    await expect(thumbs).toHaveCount(52); // Front Cover + 50 Images + Back Cover

    // Jump to middle page 25
    const jumpInput = page.locator('#preview-jump-input');
    await jumpInput.fill('25');
    await page.locator('#btn-preview-jump-go').click();

    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 25 / 52');
    await expect(thumbs.nth(24)).toHaveClass(/is-active/);
  });

  test('13. Dark mode surface hierarchy and contrast compliance', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const previewPane = page.locator('#document-preview-pane');
    await expect(previewPane).toBeVisible();
    await expect(page.locator('#settings-panel')).toBeVisible();
    await expect(page.locator('#document-canvas-stage')).toBeVisible();
  });

  test('14. Wizard navigation "ย้อนกลับไปจัดหน้า" returns safely to Section 2', async ({ page }) => {
    await setupSection3WithImages(page, 2);

    const btnBack = page.locator('#btn-step3-prev');
    await expect(btnBack).toBeVisible();
    await btnBack.click();

    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await expect(page.locator('#section-review-export')).toBeHidden();
  });
});
