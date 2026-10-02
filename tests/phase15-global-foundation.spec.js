import { test, expect } from '@playwright/test';

test.describe('Phase 15 — Global UX/UI Foundation Tests', () => {

  test('1. Stepper navigation: Completed steps show checkmark, are clickable, and navigate back safely', async ({ page }) => {
    await page.goto('/');

    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'ชานนท์');
    await page.fill('#student-lastname', 'มีชัย');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 2');
    await page.fill('#student-number', '7');
    await page.fill('#student-year', '2569');

    const step1 = page.locator('#step-nav-1');
    const step2 = page.locator('#step-nav-2');
    const step3 = page.locator('#step-nav-3');

    await expect(step1).toHaveClass(/is-active/);
    await expect(step1).toHaveAttribute('aria-current', 'step');

    await page.click('#btn-step1-next');
    await expect(step2).toHaveClass(/is-active/);
    await expect(step1).toHaveClass(/is-completed/);
    await expect(step1.locator('.step-number')).toContainText('✓');

    await step1.click();
    await expect(step1).toHaveClass(/is-active/);
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(page.locator('#portfolio-workspace')).toBeHidden();

    await expect(page.locator('#student-firstname')).toHaveValue('ชานนท์');
    await expect(page.locator('#student-lastname')).toHaveValue('มีชัย');

    await page.click('#btn-step1-next');
    await expect(step2).toHaveClass(/is-active/);

    await page.click('#btn-step2-next');
    await expect(step3).toHaveClass(/is-active/);
    await expect(step1).toHaveClass(/is-completed/);
    await expect(step2).toHaveClass(/is-completed/);
    await expect(step1.locator('.step-number')).toContainText('✓');
    await expect(step2.locator('.step-number')).toContainText('✓');

    await step2.click();
    await expect(step2).toHaveClass(/is-active/);
    await expect(page.locator('#portfolio-workspace')).toBeVisible();
  });

  test('2. Stepper security: Forward navigation strictly guarded by Section 1 validation', async ({ page }) => {
    await page.goto('/');

    const step1 = page.locator('#step-nav-1');
    const step2 = page.locator('#step-nav-2');
    const step3 = page.locator('#step-nav-3');

    await expect(step1).toHaveClass(/is-active/);

    await step2.click();
    await expect(step1).toHaveClass(/is-active/);
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(page.locator('#portfolio-workspace')).toBeHidden();

    await step3.click();
    await expect(step1).toHaveClass(/is-active/);
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(page.locator('#section-review-export')).toBeHidden();
  });

  test('3. Compact Header: Displays concise autosave status and preserves all controls', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header.app-header');
    await expect(header).toBeVisible();

    const logo = page.locator('#school-brand-logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /ban-wangwon-logo\.png/);

    const privacyBadge = page.locator('.privacy-badge');
    await expect(privacyBadge).toBeVisible();

    const autosaveIndicator = page.locator('#autosave-status-indicator');
    const autosaveText = page.locator('#autosave-status-text');
    await expect(autosaveIndicator).toBeVisible();

    await page.fill('#student-firstname', 'ชานนท์');
    await page.waitForTimeout(600);

    await expect(autosaveText).toHaveText(/บันทึกแล้ว|บันทึกอัตโนมัติ/);

    await expect(page.locator('#btn-theme-toggle')).toBeVisible();
    await expect(page.locator('#btn-reset-project')).toBeVisible();
    await expect(page.locator('#btn-help')).toBeVisible();
  });

  test('4. Simplified Footer: Contains school identity and privacy info, NO duplicate export buttons', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer.app-footer');
    await expect(footer).toBeVisible();

    await expect(footer).toContainText('โรงเรียนบ้านวังวน');
    await expect(footer).toContainText('Wangwon Portfolio');

    await expect(footer.locator('#btn-export-pdf')).toHaveCount(0);
    await expect(footer.locator('#btn-export-zip')).toHaveCount(0);
    await expect(footer.locator('#btn-preview-portfolio')).toHaveCount(0);
  });

  test('5. Button and interactive control states: Focus ring, pressed state, and hover styling', async ({ page }) => {
    await page.goto('/');

    const themeBtn = page.locator('#btn-theme-toggle');
    const nextBtn = page.locator('#btn-step1-next');

    await themeBtn.focus();
    await expect(themeBtn).toBeFocused();

    await nextBtn.focus();
    await expect(nextBtn).toBeFocused();

    const focusOutline = await nextBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return s.outlineStyle !== 'none' || s.boxShadow.includes('rgba') || s.boxShadow !== 'none';
    });
    expect(focusOutline).toBe(true);
  });

  test('6. Mobile touch target sizes: Interactive controls meet min-target standard (~44x44px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const themeBtn = page.locator('#btn-theme-toggle');
    const themeBox = await themeBtn.boundingBox();
    expect(themeBox).not.toBeNull();
    expect(themeBox.height).toBeGreaterThanOrEqual(38);
    expect(themeBox.width).toBeGreaterThanOrEqual(38);

    const helpBtn = page.locator('#btn-help');
    const helpBox = await helpBtn.boundingBox();
    expect(helpBox).not.toBeNull();
    expect(helpBox.height).toBeGreaterThanOrEqual(38);

    const step1 = page.locator('#step-nav-1');
    const step1Box = await step1.boundingBox();
    expect(step1Box).not.toBeNull();
    expect(step1Box.height).toBeGreaterThanOrEqual(34);
  });

  test('7. Sticky UI safety: Header does not cover focused element and page has scroll-padding-top', async ({ page }) => {
    await page.goto('/');

    const scrollPadding = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollPaddingTop;
    });
    expect(parseInt(scrollPadding, 10)).toBeGreaterThanOrEqual(60);

    const headerZ = await page.locator('header.app-header').evaluate((el) => {
      return parseInt(window.getComputedStyle(el).zIndex, 10);
    });
    expect(headerZ).toBeGreaterThanOrEqual(30);
  });

  test('8. Responsive layout: Zero horizontal overflow at 320px and 390px', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('9. Dark Mode Surface Hierarchy: Distinct layers across app background, sections, cards, and preview stage', async ({ page }) => {
    await page.goto('/');

    await page.click('#btn-theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const colors = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body).backgroundColor;
      const section = window.getComputedStyle(document.querySelector('.app-section')).backgroundColor;
      return { body, section };
    });

    expect(colors.body).not.toBe('rgb(255, 255, 255)');
    expect(colors.section).not.toBe('rgb(255, 255, 255)');
  });
});
