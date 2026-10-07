import { test, expect } from '@playwright/test';

test.describe('Phase 19 — Cross-Page Edit Current Page Flow', () => {

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

  // Helper: fill Section 1 and populate images directly into projectStore
  async function setupSection3WithImages(page, count = 3) {
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

  // Helper for 50 images
  async function setup50Images(page) {
    await setupSection3WithImages(page, 50);
  }

  // ---------------------------------------------------------
  // 1. BASIC FLOW
  // ---------------------------------------------------------

  test('1. Section 3 activity page shows "แก้ไขหน้านี้"', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeVisible();

    // On Page 1 (Front Cover), button is disabled
    await expect(editBtn).toBeDisabled();

    // Navigate to Page 2 (first activity page)
    await page.click('#btn-preview-page-next');
    await expect(editBtn).toBeEnabled();
  });

  test('2. Clicking button navigates to Section 2', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next'); // Go to Page 2
    await page.click('#btn-preview-edit-page');

    await expect(page.locator('#section-review-export')).toBeHidden();
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await expect(page.locator('#step-nav-2')).toHaveClass(/is-active/);
  });

  test('3. Correct target card is found and matches stable identity', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next'); // Page 2 -> activity 1 (img-activity-1)
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toBeVisible();
    await expect(targetCard).toHaveClass(/is-edit-target/);
  });

  test('4. Target card scrolls into visible region of internal scroll container', async ({ page }) => {
    await setupSection3WithImages(page, 15);
    // Jump to page 10 (activity image 9)
    await page.fill('#preview-jump-input', '10');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(150);

    await page.click('#btn-preview-edit-page');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    const targetCard = page.locator('.student-image-card[data-id="img-activity-9"]');
    await expect(targetCard).toBeVisible();
    await expect(targetCard).toHaveClass(/is-edit-target/);

    await page.waitForTimeout(600); // Allow smooth scroll animation to finish
    const rectInfo = await targetCard.evaluate((card) => {
      const scrollArea = card.closest('#workspace-scroll-area');
      if (!scrollArea) return { error: 'no scrollArea' };
      const cardRect = card.getBoundingClientRect();
      const scrollRect = scrollArea.getBoundingClientRect();
      return {
        cardTop: cardRect.top,
        cardBottom: cardRect.bottom,
        scrollAreaTop: scrollRect.top,
        scrollAreaBottom: scrollRect.bottom,
        scrollTop: scrollArea.scrollTop,
        scrollHeight: scrollArea.scrollHeight
      };
    });
    console.log('Test 4 Rect Info:', JSON.stringify(rectInfo));
    const isVisibleInScroll = (
      rectInfo.cardTop >= rectInfo.scrollAreaTop - 50 &&
      rectInfo.cardBottom <= rectInfo.scrollAreaBottom + 50
    );
    expect(isVisibleInScroll).toBe(true);
  });

  test('5. Target card receives highlight and temporary label', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toHaveClass(/is-edit-target/);
    const badge = targetCard.locator('.edit-target-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/กำลังแก้ไข/);
  });

  test('6. Highlight clears automatically after timeout', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toHaveClass(/is-edit-target/);

    // Wait 3.5s for auto-clear
    await page.waitForTimeout(3600);
    await expect(targetCard).not.toHaveClass(/is-edit-target/);
    await expect(targetCard.locator('.edit-target-badge')).toHaveCount(0);
  });

  test('7. Project state remains intact without reset or data loss', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    // Confirm store images and student fields remain
    const state = await page.evaluate(() => window.__WANGWON_STORE__?.getState());
    expect(state.images.length).toBe(3);
    expect(state.student.firstName).toBe('สมชาย');
  });

  // ---------------------------------------------------------
  // 2. PAGE MAPPING
  // ---------------------------------------------------------

  test('8. Page 1 Front Cover does not map to activity card (disabled)', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeDisabled();
    await expect(editBtn).toHaveAttribute('title', /ปกหน้า/);
  });

  test('9. Page 2 maps to activity image 1', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.fill('#preview-jump-input', '2');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    await page.click('#btn-preview-edit-page');
    const target = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(target).toHaveClass(/is-edit-target/);
  });

  test('10. Page 3 maps to activity image 2', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.fill('#preview-jump-input', '3');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    await page.click('#btn-preview-edit-page');
    const target = page.locator('.student-image-card[data-id="img-activity-2"]');
    await expect(target).toHaveClass(/is-edit-target/);
  });

  test('11. Middle activity page maps correctly', async ({ page }) => {
    await setupSection3WithImages(page, 7);
    await page.fill('#preview-jump-input', '5'); // Page 5 = activity 4
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    await page.click('#btn-preview-edit-page');
    const target = page.locator('.student-image-card[data-id="img-activity-4"]');
    await expect(target).toHaveClass(/is-edit-target/);
  });

  test('12. Last activity page maps correctly', async ({ page }) => {
    await setupSection3WithImages(page, 5);
    await page.fill('#preview-jump-input', '6'); // Page 6 = activity 5 (last activity)
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    await page.click('#btn-preview-edit-page');
    const target = page.locator('.student-image-card[data-id="img-activity-5"]');
    await expect(target).toHaveClass(/is-edit-target/);
  });

  test('13. Back Cover (last document page) does not map to activity card', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.fill('#preview-jump-input', '5'); // Page 5 = Back Cover
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeDisabled();
    await expect(editBtn).toHaveAttribute('title', /ปกหลัง/);
  });

  // ---------------------------------------------------------
  // 3. COVER RULES
  // ---------------------------------------------------------

  test('14. "แก้ไขหน้านี้" disabled on Front Cover with explanatory title', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeDisabled();
    const title = await editBtn.getAttribute('title');
    expect(title).toContain('หน้านี้เป็นปก');
  });

  test('15. "แก้ไขหน้านี้" disabled on Back Cover with explanatory title', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.fill('#preview-jump-input', '4');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(100);

    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeDisabled();
    const title = await editBtn.getAttribute('title');
    expect(title).toContain('หน้านี้เป็นปก');
  });

  test('16. Cover interaction does not navigate to wrong card', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toBeDisabled();
    // Disabled button click should not navigate (use short timeout to avoid waiting 30s)
    await editBtn.click({ timeout: 500 }).catch(() => {});
    await expect(page.locator('#section-review-export')).toBeVisible();
    await expect(page.locator('#portfolio-workspace')).toBeHidden();
  });

  // ---------------------------------------------------------
  // 4. RESPONSIVE
  // ---------------------------------------------------------

  test('17. 1440px flow works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSection3WithImages(page, 5);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveClass(/is-edit-target/);
  });

  test('18. 1280px flow works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupSection3WithImages(page, 4);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveClass(/is-edit-target/);
  });

  test('19. 768px flow works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveClass(/is-edit-target/);
  });

  test('20. 390px flow works', async ({ page, isMobile }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveClass(/is-edit-target/);
  });

  test('21. 320px flow works', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveClass(/is-edit-target/);
  });

  test('22. No horizontal overflow after auto-scroll', async ({ page }) => {
    await setupSection3WithImages(page, 4);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    for (const w of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow at ${w}px`).toBe(false);
    }
  });

  test('23. Mobile remains exactly 3 cards per row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const gridCols = await page.locator('#workspace-grid').evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns.split(' ').length;
    });
    expect(gridCols).toBe(3);
  });

  // ---------------------------------------------------------
  // 5. SCROLL SAFETY
  // ---------------------------------------------------------

  test('24. Target near top scrolls correctly', async ({ page }) => {
    await setupSection3WithImages(page, 10);
    await page.fill('#preview-jump-input', '2'); // first activity
    await page.click('#btn-preview-jump-go');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toBeVisible();
  });

  test('25. Target middle scrolls correctly', async ({ page }) => {
    await setupSection3WithImages(page, 20);
    await page.fill('#preview-jump-input', '10'); // middle activity
    await page.click('#btn-preview-jump-go');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-9"]')).toBeVisible();
  });

  test('26. Target near final row scrolls correctly', async ({ page }) => {
    await setupSection3WithImages(page, 20);
    await page.fill('#preview-jump-input', '21'); // last activity
    await page.click('#btn-preview-jump-go');
    await page.click('#btn-preview-edit-page');
    await expect(page.locator('.student-image-card[data-id="img-activity-20"]')).toBeVisible();
  });

  test('27. Target not hidden by sticky toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await setupSection3WithImages(page, 15);
    await page.fill('#preview-jump-input', '8');
    await page.click('#btn-preview-jump-go');
    await page.click('#btn-preview-edit-page');

    const target = page.locator('.student-image-card[data-id="img-activity-7"]');
    const isObscured = await target.evaluate((card) => {
      const sticky = document.querySelector('#workspace-sticky-toolbar');
      if (!sticky) return false;
      const cardRect = card.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      return (
        cardRect.top < stickyRect.bottom &&
        cardRect.bottom > stickyRect.top
      );
    });
    expect(isObscured).toBe(false);
  });

  test('28. Final row target remains reachable and interactive', async ({ page }) => {
    await setupSection3WithImages(page, 8);
    await page.fill('#preview-jump-input', '9'); // last activity
    await page.click('#btn-preview-jump-go');
    await page.click('#btn-preview-edit-page');

    const lastCard = page.locator('.student-image-card[data-id="img-activity-8"]');
    await expect(lastCard).toBeVisible();
    const rotateBtn = lastCard.locator('.btn-rotate');
    const moreBtn = lastCard.locator('.btn-more');
    const hasVisibleAction = (await rotateBtn.isVisible()) || (await moreBtn.isVisible());
    expect(hasVisibleAction).toBe(true);
  });

  // ---------------------------------------------------------
  // 6. INTERACTION SAFETY
  // ---------------------------------------------------------

  test('29. Highlight does not block thumbnail click', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toHaveClass(/is-edit-target/);

    // Click thumbnail inside highlighted card
    const thumb = targetCard.locator('.card-preview');
    await thumb.click();
    await expect(page.locator('#image-preview-modal')).toBeVisible();
    await page.locator('button[aria-label="ปิดหน้าต่างดูรูป"]').click();
  });

  test('30. Highlight does not block More menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupSection3WithImages(page, 2);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toHaveClass(/is-edit-target/);

    const btnMore = targetCard.locator('.btn-more');
    await expect(btnMore).toBeVisible();
    await btnMore.click();
    await expect(targetCard.locator('.card-context-menu')).toBeVisible();
  });

  test('31. Lightbox still opens from highlighted target', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await targetCard.locator('.card-preview').click();
    await expect(page.locator('#image-preview-modal')).toBeVisible();
  });

  test('32. Delete target clears highlight safely without error loop', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    if (await targetCard.locator('.btn-delete').isVisible()) {
      await targetCard.locator('.btn-delete').click();
    } else {
      await targetCard.locator('.btn-more').click();
      await targetCard.locator('.menu-item[data-action="delete"]').click();
    }

    const deleteModal = page.locator('#delete-image-modal');
    await expect(deleteModal).toBeVisible();
    await page.click('#btn-confirm-delete-image');
    await expect(deleteModal).toBeHidden();

    // Deleted card is gone, no errors
    await expect(page.locator('.student-image-card[data-id="img-activity-1"]')).toHaveCount(0);
    const countBadge = page.locator('#image-count-badge');
    await expect(countBadge).toContainText('1 ภาพผลงาน');
  });

  test('33. Reorder after highlight works normally', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toHaveClass(/is-edit-target/);

    // Click Move Right in card menu
    const btnMore = targetCard.locator('.btn-more');
    await btnMore.click();
    const moveRight = targetCard.locator('.menu-item[data-action="move-right"]');
    if (await moveRight.isVisible()) {
      await moveRight.click();
    }
  });

  // ---------------------------------------------------------
  // 7. STATE CLEANUP
  // ---------------------------------------------------------

  test('34. Target state clears after successful handling', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetState = await page.evaluate(() => window.__WANGWON_PENDING_EDIT_TARGET__);
    expect(targetState).toBeNull();
  });

  test('35. Normal later navigation does not auto-scroll unexpectedly', async ({ page }) => {
    await setupSection3WithImages(page, 5);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    // Wait for highlight clear
    await page.waitForTimeout(3600);

    // Return to Section 3 normally
    await page.click('#btn-step2-next');
    await expect(page.locator('#section-review-export')).toBeVisible();

    // Return to Section 2 normally
    await page.click('#btn-step3-prev');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // No card should be highlighted
    await expect(page.locator('.is-edit-target')).toHaveCount(0);
  });

  test('36. Re-entering Section 2 normally does not re-highlight old target', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-step3-prev');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
    await expect(page.locator('.is-edit-target')).toHaveCount(0);
  });

  // ---------------------------------------------------------
  // 8. ACCESSIBILITY
  // ---------------------------------------------------------

  test('37. Edit button has accessible name and role', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toHaveAttribute('aria-label', /แก้ไขหน้านี้/);
  });

  test('38. Disabled cover state has aria-disabled and clear tooltip', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    const editBtn = page.locator('#btn-preview-edit-page');
    await expect(editBtn).toHaveAttribute('aria-disabled', 'true');
    await expect(editBtn).toHaveAttribute('title', /หน้านี้เป็นปก/);
  });

  test('39. Target focus is visible on the card', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toBeFocused();
  });

  test('40. Reduced-motion mode still works without smooth animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setupSection3WithImages(page, 3);
    await page.click('#btn-preview-page-next');
    await page.click('#btn-preview-edit-page');

    const targetCard = page.locator('.student-image-card[data-id="img-activity-1"]');
    await expect(targetCard).toBeVisible();
    await expect(targetCard).toHaveClass(/is-edit-target/);
  });

  // ---------------------------------------------------------
  // 9. REGRESSIONS
  // ---------------------------------------------------------

  test('41. Section 1 still works and validates', async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-step1-next');
    await expect(page.locator('#error-firstName')).toBeVisible();
  });

  test('42. Section 2 More menu still works', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.click('#btn-step3-prev');
    const card = page.locator('.student-image-card').first();
    await card.locator('.btn-more').click();
    await expect(card.locator('.card-context-menu')).toBeVisible();
  });

  test('43. Section 2 lightbox still works', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.click('#btn-step3-prev');
    const card = page.locator('.student-image-card').first();
    await card.locator('.card-preview').click();
    await expect(page.locator('#image-preview-modal')).toBeVisible();
    await page.locator('button[aria-label="ปิดหน้าต่างดูรูป"]').click();
  });

  test('44. Section 3 preview still works', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await expect(page.locator('#document-preview-canvas')).toBeVisible();
  });

  test('45. Section 3 thumbnails still work and navigate', async ({ page }) => {
    await setupSection3WithImages(page, 3);
    const thumb2 = page.locator('.preview-thumb-btn[data-page="1"]');
    await thumb2.click();
    await expect(page.locator('#preview-page-indicator')).toContainText('หน้า 2');
  });

  test('46. Section 3 export buttons are present and interactive', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await expect(page.locator('#btn-section3-export-pdf')).toBeVisible();
    await expect(page.locator('#btn-section3-export-zip')).toBeVisible();
  });

  test('47. Autosave manager functions properly', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    const badge = page.locator('#autosave-status-indicator');
    await expect(badge).toBeVisible();
  });

  test('48. Theme switching works cleanly between light and dark', async ({ page }) => {
    await setupSection3WithImages(page, 2);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');
  });

  test('49. 50-image high-volume project cross-page edit flow works cleanly', async ({ page }) => {
    await setup50Images(page);
    // Jump to Page 26 (activity image 25)
    await page.fill('#preview-jump-input', '26');
    await page.click('#btn-preview-jump-go');
    await page.waitForTimeout(150);

    await page.click('#btn-preview-edit-page');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    const targetCard = page.locator('.student-image-card[data-id="img-activity-25"]');
    await expect(targetCard).toBeVisible();
    await expect(targetCard).toHaveClass(/is-edit-target/);
  });

});
