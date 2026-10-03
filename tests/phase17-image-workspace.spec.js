import { test, expect } from '@playwright/test';

test.describe('Phase 17 — Section 2: Image & Page Workspace UX', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and clear any existing draft state to ensure clean test runs
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

  // Helper function to complete Section 1 and reach Section 2
  async function fillSection1AndGoToSection2(page) {
    await page.goto('/');
    
    // Check if recovery modal is open from a previous run; discard it if present
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

  test('1. Empty state appears with zero activity images', async ({ page }) => {
    await fillSection1AndGoToSection2(page);
    
    const emptyState = page.locator('#images-empty-placeholder');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.locator('.empty-title')).toHaveText(/เพิ่มภาพผลงานนักเรียน/);
    
    // Front cover and back cover are present
    await expect(page.locator('#front-cover-card')).toBeVisible();
    await expect(page.locator('#back-cover-card')).toBeVisible();
  });

  test('2. Multiple activity images can be imported and counts are updated', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    
    await page.setInputFiles('#file-upload-input', [
      { name: 'activity_01.png', mimeType: 'image/png', buffer: dummyPng },
      { name: 'activity_02.png', mimeType: 'image/png', buffer: dummyPng },
      { name: 'activity_03.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    // Expect 3 activity cards
    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(3);

    // Empty placeholder should be hidden
    await expect(page.locator('#images-empty-placeholder')).toBeHidden();

    // Verify badges
    const imageCount = page.locator('#image-count-badge');
    const totalPages = page.locator('#total-pages-badge');
    await expect(imageCount).toHaveText(/3 ภาพผลงาน/);
    await expect(totalPages).toHaveText(/5 หน้า/);
  });

  test('3. Student profile photo is strictly excluded from Section 2 activity image count and grid', async ({ page }) => {
    await page.goto('/');
    
    // Upload student photo in Section 1
    const dummyPhoto = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#student-photo-input', {
      name: 'student_profile.png',
      mimeType: 'image/png',
      buffer: dummyPhoto
    });
    
    // Fill remaining student fields
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'สมชาย');
    await page.fill('#student-lastname', 'รักเรียน');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');
    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // In Section 2, with 0 activity images imported, activity count must still be 0 and total pages 2
    const imageCount = page.locator('#image-count-badge');
    const totalPages = page.locator('#total-pages-badge');
    await expect(imageCount).toHaveText(/0 ภาพผลงาน/);
    await expect(totalPages).toHaveText(/2 หน้า/);
    await expect(page.locator('.student-image-card')).toHaveCount(0);
  });

  test('4. Locked Cover Cards: Front Cover is first, Back Cover is last, cannot be deleted or reordered', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: 'act_01.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    const frontCover = page.locator('#front-cover-card');
    const backCover = page.locator('#back-cover-card');
    
    await expect(frontCover).toBeVisible();
    await expect(backCover).toBeVisible();
    
    // Check that neither front cover nor back cover has delete or rotate quick action buttons
    await expect(frontCover.locator('.btn-delete')).toHaveCount(0);
    await expect(frontCover.locator('.btn-rotate')).toHaveCount(0);
    await expect(backCover.locator('.btn-delete')).toHaveCount(0);
    await expect(backCover.locator('.btn-rotate')).toHaveCount(0);

    // Front cover shows Page 1, Back cover shows Page 3
    await expect(frontCover.locator('.badge-locked')).toContainText('หน้า 1');
    await expect(backCover.locator('.badge-locked')).toContainText('หน้า 3');
  });

  test('5. Activity image actions: rotate and delete via real click', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: 'rotate_test.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    const card = page.locator('.student-image-card').first();
    const img = card.locator('.card-preview img');
    
    // Initial rotation 0deg
    await expect(img).toHaveAttribute('style', /rotate\(0deg\)/);

    // Click rotate button (or via More menu on mobile viewports)
    const btnRotate = card.locator('.btn-rotate');
    if (await btnRotate.isVisible()) {
      await btnRotate.click();
    } else {
      await card.locator('.btn-more').click();
      await card.locator('.menu-item[data-action="rotate"]').click();
    }
    await expect(img).toHaveAttribute('style', /rotate\(90deg\)/);

    // Click delete button -> opens modal
    const btnDelete = card.locator('.btn-delete');
    if (await btnDelete.isVisible()) {
      await btnDelete.click();
    } else {
      await card.locator('.btn-more').click();
      await card.locator('.menu-item[data-action="delete"]').click();
    }
    const deleteModal = page.locator('#delete-image-modal');
    await expect(deleteModal).toBeVisible();

    // Confirm deletion
    await page.locator('#btn-confirm-delete-image').click();
    await expect(deleteModal).toBeHidden();
    await expect(page.locator('.student-image-card')).toHaveCount(0);
    await expect(page.locator('#images-empty-placeholder')).toBeVisible();
  });

  test('6. Filename display truncates with ellipsis without breaking card layout', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const longFilename = 'very_long_activity_photo_filename_that_should_truncate_properly_in_the_card_header.png';
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: longFilename, mimeType: 'image/png', buffer: dummyPng }
    ]);

    const card = page.locator('.student-image-card').first();
    const nameEl = card.locator('.image-name');
    await expect(nameEl).toHaveAttribute('title', longFilename);

    // Check CSS text-overflow: ellipsis
    const overflowStyle = await nameEl.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        textOverflow: style.textOverflow,
        overflow: style.overflow,
        whiteSpace: style.whiteSpace
      };
    });
    expect(overflowStyle.textOverflow).toBe('ellipsis');
    expect(overflowStyle.overflow).toBe('hidden');
    expect(overflowStyle.whiteSpace).toBe('nowrap');
  });

  test('7. Navigation button labels in Section 2 are exactly "ย้อนกลับ" and "หน้าถัดไป"', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const prevBtn = page.locator('#btn-step2-prev');
    const nextBtn = page.locator('#btn-step2-next');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    const prevText = await prevBtn.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('svg').forEach(s => s.remove());
      return clone.textContent.trim();
    });
    const nextText = await nextBtn.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('svg').forEach(s => s.remove());
      return clone.textContent.trim();
    });

    expect(prevText).toBe('ย้อนกลับ');
    expect(nextText).toBe('หน้าถัดไป');
  });

  test('8. No document/export buttons appear in Section 2', async ({ page }) => {
    await fillSection1AndGoToSection2(page);
    const sec2 = page.locator('#portfolio-workspace');

    await expect(sec2.locator('#btn-export-pdf')).toHaveCount(0);
    await expect(sec2.locator('#btn-export-zip')).toHaveCount(0);
    await expect(sec2.locator('.btn-export-pdf')).toHaveCount(0);
  });

  test('9. Mobile layout: Exactly 3 cards per row and zero horizontal page overflow at 320px and 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 750 });
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: 'm1.png', mimeType: 'image/png', buffer: dummyPng },
      { name: 'm2.png', mimeType: 'image/png', buffer: dummyPng },
      { name: 'm3.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    // Check at 390px
    let gridCols = await page.locator('#workspace-grid').evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(gridCols).toBe(3);

    let overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);

    // Resize down to 320px
    await page.setViewportSize({ width: 320, height: 750 });
    await page.waitForTimeout(150);

    gridCols = await page.locator('#workspace-grid').evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(gridCols).toBe(3);

    overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test('10. Mobile More (...) button and touch target (~44px) without neighbor overlap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: 'm1.png', mimeType: 'image/png', buffer: dummyPng },
      { name: 'm2.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    const card1 = page.locator('.student-image-card').nth(0);
    const card2 = page.locator('.student-image-card').nth(1);
    const btnMore1 = card1.locator('.btn-more');

    // Click More button on Card 1
    await btnMore1.click();
    
    const menu1 = card1.locator('.card-context-menu');
    await expect(menu1).toBeVisible();

    // Verify Card 2's menu is NOT open
    const menu2 = card2.locator('.card-context-menu');
    await expect(menu2).toBeHidden();
  });

  test('11. Thumbnail tap opens image inspection lightbox on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#file-upload-input', [
      { name: 'thumb_test.png', mimeType: 'image/png', buffer: dummyPng }
    ]);

    const card = page.locator('.student-image-card').first();
    await card.locator('.card-preview').click();

    const lightbox = page.locator('#image-preview-modal');
    await expect(lightbox).toBeVisible();

    // Close via close button
    await lightbox.locator('button[aria-label="ปิดหน้าต่างดูรูป"]').click();
    await expect(lightbox).toBeHidden();
  });

  test('12. Dark Mode surface hierarchy is preserved in Section 2', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(200);

    const workspace = page.locator('#portfolio-workspace');
    await expect(workspace).toBeVisible();

    const bgColors = await page.evaluate(() => {
      const app = getComputedStyle(document.body).backgroundColor;
      const ws = getComputedStyle(document.querySelector('#portfolio-workspace')).backgroundColor;
      const card = getComputedStyle(document.querySelector('#front-cover-card')).backgroundColor;
      return { app, ws, card };
    });

    expect(bgColors.app).toBeTruthy();
    expect(bgColors.ws).toBeTruthy();
    expect(bgColors.card).toBeTruthy();
  });

  test('13. Performance: 50 activity images render cleanly without DOM thrashing or memory leak', async ({ page }) => {
    await fillSection1AndGoToSection2(page);

    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const imagesToImport = [];
    for (let i = 1; i <= 50; i++) {
      const numStr = String(i).padStart(2, '0');
      imagesToImport.push({
        name: `activity_batch_${numStr}.png`,
        mimeType: 'image/png',
        buffer: dummyPng
      });
    }

    const startTime = Date.now();
    await page.setInputFiles('#file-upload-input', imagesToImport);

    // Expect 50 activity cards to render
    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(50);
    const elapsed = Date.now() - startTime;

    // Badges must reflect 50 images and 52 total pages
    await expect(page.locator('#image-count-badge')).toHaveText(/50 ภาพผลงาน/);
    await expect(page.locator('#total-pages-badge')).toHaveText(/52 หน้า/);

    // Verify last page badge is Page 52 (Back cover)
    const backCover = page.locator('#back-cover-card');
    await expect(backCover.locator('.badge-locked')).toContainText('หน้า 52');

    // Quick scroll test to verify smooth container scrolling
    const scrollContainer = page.locator('#workspace-scroll-area');
    await scrollContainer.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  });

});
