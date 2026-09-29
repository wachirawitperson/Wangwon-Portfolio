import { test, expect } from '@playwright/test';

test.describe('Wangwon Portfolio - Phase 2 Design System & App Shell Tests', () => {

  test('1. Page loads without error', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (exception) => {
      jsErrors.push(exception.message);
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(jsErrors).toEqual([]);
  });

  test('2. Header visible and 3. Product title visible', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header.app-header');
    await expect(header).toBeVisible();

    const title = header.locator('.app-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Wangwon Portfolio');

    const subtitle = header.locator('.app-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toHaveText('ระบบสร้าง Portfolio นักเรียน');
  });

  test('4. Privacy indicator visible with verified copy', async ({ page }) => {
    await page.goto('/');

    const privacyBadge = page.locator('.privacy-badge');
    await expect(privacyBadge).toBeVisible();
    await expect(privacyBadge).toContainText('ประมวลผลรูปในเครื่อง • ไม่อัปโหลดรูปนักเรียน');
  });

  test('5. Student information section visible with required fields and live filename', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('#student-section');
    await expect(section).toBeVisible();

    await expect(page.locator('#student-prefix')).toBeVisible();
    await expect(page.locator('#student-firstname')).toBeVisible();
    await expect(page.locator('#student-lastname')).toBeVisible();
    await expect(page.locator('#student-grade')).toBeVisible();
    await expect(page.locator('#student-number')).toBeVisible();
    await expect(page.locator('#student-year')).toBeVisible();

    // Verify live filename badge
    const filenameBadge = page.locator('#preview-filename-badge');
    await expect(filenameBadge).toBeVisible();

    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'วัฒนากุลชัย');
    await expect(filenameBadge).toHaveText('ด.ช.กิตติพัฒน์_วัฒนากุลชัย.pdf');
  });

  test('6. Front cover card visible and 7. Front cover card shows locked state', async ({ page }) => {
    await page.goto('/');

    const frontCover = page.locator('#front-cover-card');
    await expect(frontCover).toBeVisible();

    const lockedBadge = frontCover.locator('.badge-locked');
    await expect(lockedBadge).toBeVisible();
    await expect(lockedBadge).toContainText('หน้า 1');
    await expect(frontCover).toContainText('ปกหน้าจะอยู่หน้าแรกเสมอ');
  });

  test('8. Back cover card visible and 9. Back cover card shows locked state', async ({ page }) => {
    await page.goto('/');

    const backCover = page.locator('#back-cover-card');
    await expect(backCover).toBeVisible();

    const lockedBadge = backCover.locator('.badge-locked');
    await expect(lockedBadge).toBeVisible();
    await expect(lockedBadge).toContainText('หน้าสุดท้าย');
    await expect(backCover).toContainText('ปกหลังจะอยู่หน้าสุดท้ายเสมอ');
  });

  test('10. Add-image empty state visible between covers', async ({ page }) => {
    await page.goto('/');

    const emptyCard = page.locator('#images-empty-placeholder');
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard).toContainText('เพิ่มภาพผลงานนักเรียน');
    await expect(emptyCard).toContainText('ภาพแรกที่เพิ่มจะเป็นหน้า 2');
    await expect(page.locator('#btn-empty-add-images')).toBeVisible();
  });

  test('11. Settings section visible with paper, placement, quality, and watermark', async ({ page }) => {
    await page.goto('/');

    const settings = page.locator('#settings-panel');
    await expect(settings).toBeVisible();
    await expect(page.locator('#setting-orientation')).toBeVisible();
    await expect(page.locator('[data-setting="placement"][data-value="fit"]')).toBeVisible();
    await expect(page.locator('#setting-quality')).toHaveValue('balanced');
    await expect(page.locator('#setting-watermark-enabled')).toBeVisible();
  });

  test('12. Preview action visible and 13. Create PDF action visible', async ({ page }) => {
    await page.goto('/');

    const previewBtn = page.locator('#btn-preview-portfolio');
    await expect(previewBtn).toBeVisible();

    const exportBtn = page.locator('#btn-export-pdf');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveClass(/btn-primary/);
  });

  test('14. Keyboard focus visible on primary controls', async ({ page }) => {
    await page.goto('/');

    const exportBtn = page.locator('#btn-export-pdf');
    await exportBtn.focus();
    await expect(exportBtn).toBeFocused();

    const previewBtn = page.locator('#btn-preview-portfolio');
    await previewBtn.focus();
    await expect(previewBtn).toBeFocused();

    const firstnameInput = page.locator('#student-firstname');
    await firstnameInput.focus();
    await expect(firstnameInput).toBeFocused();
  });

  test('15. Mobile 390x844 has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('16. Mobile 375x667 has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('17. Tablet 768x1024 has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('18. Desktop 1440x900 renders correct hierarchy without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.locator('header.app-header');
    await expect(header).toBeVisible();
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    const actionToolbar = page.locator('#action-toolbar');
    await expect(actionToolbar).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('19. Modal foundation can open and close with accessible focus handling and ESC key', async ({ page }) => {
    await page.goto('/');

    const helpBtn = page.locator('#btn-help');
    const helpModal = page.locator('#help-modal');

    await expect(helpModal).toHaveAttribute('aria-hidden', 'true');
    await helpBtn.click();

    // Verify modal is open and visible
    await expect(helpModal).toHaveAttribute('aria-hidden', 'false');
    await expect(helpModal.locator('#help-modal-title')).toBeVisible();

    // Verify ESC key closes modal
    await page.keyboard.press('Escape');
    await expect(helpModal).toHaveAttribute('aria-hidden', 'true');
    await expect(helpBtn).toBeFocused();

    // Verify Reset modal opens and closes via dismiss button
    const resetBtn = page.locator('#btn-reset-project');
    const resetModal = page.locator('#reset-confirm-modal');
    await resetBtn.click();
    await expect(resetModal).toHaveAttribute('aria-hidden', 'false');

    const cancelBtn = resetModal.locator('[data-dismiss="modal"]', { hasText: 'ยกเลิก' });
    await cancelBtn.click();
    await expect(resetModal).toHaveAttribute('aria-hidden', 'true');
  });

  test('20. Toast component renders correctly across notification types', async ({ page }) => {
    await page.goto('/');

    // Trigger toast via global test helper
    await page.evaluate(() => {
      window.__WANGWON_TOAST__.showToast('ทดสอบการแจ้งเตือนสำเร็จ', 'success');
      window.__WANGWON_TOAST__.showToast('ทดสอบการแจ้งเตือนเตือนภัย', 'warning');
    });

    const successToast = page.locator('.toast.toast-success');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText('ทดสอบการแจ้งเตือนสำเร็จ');

    const warningToast = page.locator('.toast.toast-warning');
    await expect(warningToast).toBeVisible();
    await expect(warningToast).toContainText('ทดสอบการแจ้งเตือนเตือนภัย');
  });

  test('Visual QA: Capture Screenshots for Desktop, Tablet, Mobile and Long Thai Name', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/desktop-1440x900.png', fullPage: true });

    // 2. Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/tablet-768x1024.png', fullPage: true });

    // 3. Mobile 390x844 (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/mobile-390x844.png', fullPage: true });

    // 4. Mobile 375x667 (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/mobile-375x667.png', fullPage: true });

    // 5. Long Thai Student Name QA (เด็กชายกิตติพัฒน์ วัฒนากุลชัย)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'วัฒนากุลชัย');
    await page.screenshot({ path: 'tests/screenshots/long-student-name.png', fullPage: false });

    // 6. Modal Open Screenshot
    const helpBtn = page.locator('#btn-help');
    await helpBtn.click();
    await page.screenshot({ path: 'tests/screenshots/modal-open.png', fullPage: false });
  });

});
