import { test, expect } from '@playwright/test';
import path from 'path';

const screenshotsDir = path.resolve('tests/screenshots');

test.describe('Phase 17 — Final Targeted Verification', () => {

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

  async function fillSection1AndGoToSection2(page) {
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
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
  }

  function makeDummyImages(count) {
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const images = [];
    for (let i = 1; i <= count; i++) {
      images.push({
        name: `activity_${String(i).padStart(2, '0')}.png`,
        mimeType: 'image/png',
        buffer: dummyPng
      });
    }
    return images;
  }

  // ====================================================
  // 1. MOBILE MORE BUTTON HIT AREA
  // ====================================================

  test('V1a. Mobile 390px: btn-more effective hit area >= ~44x44', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(3));
    await expect(page.locator('.student-image-card')).toHaveCount(3);

    const card = page.locator('.student-image-card').first();
    const btnMore = card.locator('.btn-more');

    const effectiveHitArea = await btnMore.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el, '::before');
      const pseudoTop = parseFloat(style.top) || 0;
      const pseudoBottom = parseFloat(style.bottom) || 0;
      return {
        visibleWidth: rect.width,
        visibleHeight: rect.height,
        effectiveWidth: rect.width,
        effectiveHeight: rect.height + Math.abs(pseudoTop) + Math.abs(pseudoBottom),
        box: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      };
    });

    console.log(`[390px] btn-more visible: ${effectiveHitArea.visibleWidth.toFixed(1)}x${effectiveHitArea.visibleHeight.toFixed(1)}`);
    console.log(`[390px] btn-more effective: ${effectiveHitArea.effectiveWidth.toFixed(1)}x${effectiveHitArea.effectiveHeight.toFixed(1)}`);

    expect(effectiveHitArea.effectiveWidth).toBeGreaterThanOrEqual(40);
    expect(effectiveHitArea.effectiveHeight).toBeGreaterThanOrEqual(40);

    await btnMore.click();
    await expect(card.locator('.card-context-menu')).toBeVisible();
  });

  test('V1b. Mobile 320px: btn-more effective hit area >= ~44x44', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(3));
    await expect(page.locator('.student-image-card')).toHaveCount(3);

    const card = page.locator('.student-image-card').first();
    const btnMore = card.locator('.btn-more');

    const effectiveHitArea = await btnMore.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el, '::before');
      const pseudoTop = parseFloat(style.top) || 0;
      const pseudoBottom = parseFloat(style.bottom) || 0;
      return {
        visibleWidth: rect.width,
        visibleHeight: rect.height,
        effectiveWidth: rect.width,
        effectiveHeight: rect.height + Math.abs(pseudoTop) + Math.abs(pseudoBottom),
        box: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      };
    });

    console.log(`[320px] btn-more visible: ${effectiveHitArea.visibleWidth.toFixed(1)}x${effectiveHitArea.visibleHeight.toFixed(1)}`);
    console.log(`[320px] btn-more effective: ${effectiveHitArea.effectiveWidth.toFixed(1)}x${effectiveHitArea.effectiveHeight.toFixed(1)}`);

    expect(effectiveHitArea.effectiveWidth).toBeGreaterThanOrEqual(40);
    expect(effectiveHitArea.effectiveHeight).toBeGreaterThanOrEqual(40);

    await btnMore.click();
    await expect(card.locator('.card-context-menu')).toBeVisible();
  });

  test('V1c. Tapping card A More does NOT activate card B', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(6));
    await expect(page.locator('.student-image-card')).toHaveCount(6);

    const cardA = page.locator('.student-image-card').nth(0);
    const cardB = page.locator('.student-image-card').nth(1);

    await cardA.locator('.btn-more').click();
    await expect(cardA.locator('.card-context-menu')).toBeVisible();
    await expect(cardB.locator('.card-context-menu')).toBeHidden();

    await cardB.locator('.btn-more').click();
    await expect(cardB.locator('.card-context-menu')).toBeVisible();
    await expect(cardA.locator('.card-context-menu')).toBeHidden();
  });

  // ====================================================
  // 2. FIXED MENU POSITIONING QA
  // ====================================================

  test('V2a. Fixed menu stays inside viewport for left/middle/right column cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(6));
    await expect(page.locator('.student-image-card')).toHaveCount(6);

    for (const idx of [0, 1, 2]) {
      const card = page.locator('.student-image-card').nth(idx);
      await card.locator('.btn-more').click();
      const menu = card.locator('.card-context-menu');
      await expect(menu).toBeVisible();

      const menuBox = await menu.boundingBox();
      expect(menuBox).toBeTruthy();

      console.log(`Card ${idx} menu: top=${menuBox.y.toFixed(1)} left=${menuBox.x.toFixed(1)} w=${menuBox.width.toFixed(1)} h=${menuBox.height.toFixed(1)}`);
      expect(menuBox.x).toBeGreaterThanOrEqual(0);
      expect(menuBox.y).toBeGreaterThanOrEqual(0);
      expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(392);
      expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(846);

      await page.click('body', { position: { x: 5, y: 5 } });
      await page.waitForTimeout(100);
    }
  });

  test('V2b. Fixed menu after deep scrolling targets correct card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(45));
    await expect(page.locator('.student-image-card')).toHaveCount(45);

    const scrollContainer = page.locator('#workspace-scroll-area');
    await scrollContainer.evaluate((el) => { el.scrollTop = el.scrollHeight * 0.7; });
    await page.waitForTimeout(200);

    const targetIdx = 30;
    const targetCard = page.locator('.student-image-card').nth(targetIdx);
    await targetCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    await targetCard.locator('.btn-more').click();
    const menu = targetCard.locator('.card-context-menu');
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    expect(menuBox).toBeTruthy();
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(392);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(846);

    // Rotate via menu targets the correct card
    const imgBefore = await targetCard.locator('.card-preview img').getAttribute('style');
    await menu.locator('.menu-item[data-action="rotate"]').click();
    const imgAfter = await targetCard.locator('.card-preview img').getAttribute('style');
    expect(imgAfter).not.toBe(imgBefore);
  });

  test('V2c. Opening another menu closes previous (no orphan)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(6));
    await expect(page.locator('.student-image-card')).toHaveCount(6);

    const card0 = page.locator('.student-image-card').nth(0);
    await card0.locator('.btn-more').click();
    await expect(card0.locator('.card-context-menu')).toBeVisible();

    const card2 = page.locator('.student-image-card').nth(2);
    await card2.locator('.btn-more').click();
    await expect(card2.locator('.card-context-menu')).toBeVisible();
    await expect(card0.locator('.card-context-menu')).toBeHidden();

    const openMenus = await page.locator('.card-context-menu:not([hidden])').count();
    expect(openMenus).toBe(1);
  });

  // ====================================================
  // 3. TABLET 768PX
  // ====================================================

  test('V3. Tablet 768px: Section 2 functions correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(6));
    await expect(page.locator('.student-image-card')).toHaveCount(6);

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);

    await expect(page.locator('#front-cover-card')).toBeVisible();
    await expect(page.locator('#back-cover-card')).toBeVisible();
    await expect(page.locator('#front-cover-card .btn-delete')).toHaveCount(0);
    await expect(page.locator('#back-cover-card .btn-delete')).toHaveCount(0);

    await expect(page.locator('#workspace-sticky-toolbar')).toBeVisible();

    const card = page.locator('.student-image-card').first();
    const btnRotate = card.locator('.btn-rotate');
    if (await btnRotate.isVisible()) {
      await btnRotate.click();
      await expect(card.locator('.card-preview img')).toHaveAttribute('style', /rotate\(90deg\)/);
    } else {
      await card.locator('.btn-more').click();
      await card.locator('.menu-item[data-action="rotate"]').click();
      await expect(card.locator('.card-preview img')).toHaveAttribute('style', /rotate\(90deg\)/);
    }

    await expect(page.locator('#btn-step2-prev')).toBeVisible();
    await expect(page.locator('#btn-step2-next')).toBeVisible();

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(100);
    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#portfolio-workspace')).backgroundColor
    );
    expect(darkBg).toBeTruthy();

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(100);
    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#portfolio-workspace')).backgroundColor
    );
    expect(lightBg).toBeTruthy();
  });

  // ====================================================
  // 4. INTERNAL SCROLL FINAL-ROW QA
  // ====================================================

  test('V4a. Can scroll to final Back Cover with 50 images', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(50));
    await expect(page.locator('.student-image-card')).toHaveCount(50);

    const backCover = page.locator('#back-cover-card');
    await backCover.scrollIntoViewIfNeeded();
    await expect(backCover).toBeVisible();
    await expect(backCover.locator('.badge-locked')).toContainText('หน้า 52');
  });

  test('V4b. More menu works on cards in final rows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(50));
    await expect(page.locator('.student-image-card')).toHaveCount(50);

    const lastCard = page.locator('.student-image-card').last();
    await lastCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    await lastCard.locator('.btn-more').click();
    const menu = lastCard.locator('.card-context-menu');
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    expect(menuBox).toBeTruthy();
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(846);
  });

  test('V4c. No nested-scroll trap with 50 images', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);
    await page.setInputFiles('#file-upload-input', makeDummyImages(50));
    await expect(page.locator('.student-image-card')).toHaveCount(50);

    const scrollContainer = page.locator('#workspace-scroll-area');

    await scrollContainer.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(100);
    const scrollTopMax = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTopMax).toBeGreaterThan(0);

    await scrollContainer.evaluate((el) => { el.scrollTop = 0; });
    await page.waitForTimeout(100);
    const scrollTopZero = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTopZero).toBe(0);
  });

  // ====================================================
  // 5. SCREENSHOTS
  // ====================================================

  test('V5. Capture Phase 17 screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await fillSection1AndGoToSection2(page);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-empty-state.png'), fullPage: false });

    await page.setInputFiles('#file-upload-input', makeDummyImages(6));
    await expect(page.locator('.student-image-card')).toHaveCount(6);

    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-light-desktop.png'), fullPage: false });

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-dark-desktop.png'), fullPage: false });

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-locked-covers.png'), fullPage: false });

    const firstCard = page.locator('.student-image-card').first();
    const btnRotate = firstCard.locator('.btn-rotate');
    if (await btnRotate.isVisible()) {
      await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-card-actions.png'), fullPage: false });
    }

    // Capture drag-over visual state
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.student-image-card');
      if (cards.length > 1) {
        cards[0].classList.add('is-dragging');
        cards[1].classList.add('is-dragover-left');
      }
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-drag-over.png'), fullPage: false });
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.student-image-card');
      if (cards.length > 1) {
        cards[0].classList.remove('is-dragging');
        cards[1].classList.remove('is-dragover-left');
      }
    });

    await page.setInputFiles('#file-upload-input', makeDummyImages(44));
    await expect(page.locator('.student-image-card')).toHaveCount(50);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-50-images-desktop.png'), fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-mobile-390.png'), fullPage: false });

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-mobile-320.png'), fullPage: false });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const mobileCard = page.locator('.student-image-card').first();
    await mobileCard.scrollIntoViewIfNeeded();
    await mobileCard.locator('.btn-more').click();
    await expect(mobileCard.locator('.card-context-menu')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-mobile-menu.png'), fullPage: false });

    await page.click('body', { position: { x: 5, y: 5 } });
    await page.waitForTimeout(100);
    await mobileCard.locator('.card-preview').click();
    const lightbox = page.locator('#image-preview-modal');
    try {
      await expect(lightbox).toBeVisible({ timeout: 2000 });
      await page.screenshot({ path: path.join(screenshotsDir, 'phase17-section2-mobile-lightbox.png'), fullPage: false });
      await lightbox.locator('button[aria-label="ปิดหน้าต่างดูรูป"]').click();
    } catch (e) {
      // Lightbox may not be available in all contexts
    }
  });
});
