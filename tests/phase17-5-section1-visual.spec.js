import { test, expect } from '@playwright/test';

test.describe('Phase 17.5 — Section 1 Visual Refinement with Real School Hero', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Section 1 Hero container exists and contains school hero image', async ({ page }) => {
    const hero = page.locator('#section1-hero');
    await expect(hero).toBeVisible();

    const heroImg = page.locator('.hero-bg-img');
    await expect(heroImg).toBeVisible();
    const src = await heroImg.getAttribute('src');
    expect(src).toContain('ban-wangwon-school-hero.jpg');
  });

  test('2. Hero text content matches exact requirements', async ({ page }) => {
    const overline = page.locator('.hero-overline');
    await expect(overline).toHaveText('STUDENT PORTFOLIO');

    const title = page.locator('#heading-student-hero');
    await expect(title).toHaveText('ข้อมูลนักเรียน');

    const desc = page.locator('.hero-desc');
    await expect(desc).toHaveText('กรอกข้อมูลนักเรียนสำหรับจัดทำหน้าปกและเอกสารแฟ้มสะสมผลงาน');
  });

  test('3. Step navigator is integrated and functional inside Hero', async ({ page }) => {
    const stepNav = page.locator('#step-navigator');
    await expect(stepNav).toBeVisible();

    const step1 = page.locator('#step-nav-1');
    const step2 = page.locator('#step-nav-2');
    const step3 = page.locator('#step-nav-3');

    await expect(step1).toHaveClass(/is-active/);
    await expect(step2).not.toHaveClass(/is-active/);
    await expect(step3).not.toHaveClass(/is-active/);
  });

  test('4. Two modern cards layout in Section 1', async ({ page }) => {
    const photoCard = page.locator('#student-photo-card');
    const infoCard = page.locator('#student-edit-card');

    await expect(photoCard).toBeVisible();
    await expect(infoCard).toBeVisible();

    // Check photo card titles
    await expect(photoCard.locator('.card-title-main')).toHaveText('รูปถ่ายนักเรียน (ไม่บังคับ)');
    await expect(photoCard.locator('.card-subtitle-main')).toHaveText('ใช้สำหรับหน้าปกแฟ้มสะสมผลงาน');

    // Check info card titles
    await expect(infoCard.locator('#heading-student-info')).toHaveText('ข้อมูลพื้นฐานของนักเรียน');
    await expect(infoCard.locator('.card-subtitle-main')).toHaveText('กรอกข้อมูลให้ถูกต้องและครบถ้วน เพื่อนำไปใช้ในการสร้างแฟ้มสะสมผลงาน');
  });

  test('5. Photo card empty state: 4:5 ratio and placeholder text', async ({ page }) => {
    const frame = page.locator('#student-photo-preview-wrap');
    await expect(frame).toBeVisible();

    const placeholder = page.locator('#student-photo-placeholder');
    await expect(placeholder).toBeVisible();
    await expect(page.locator('.photo-placeholder-title')).toHaveText('ยังไม่ได้เลือกรูปถ่าย');
    await expect(page.locator('.photo-placeholder-ratio')).toHaveText('อัตราส่วน 4:5');
    await expect(page.locator('.photo-placeholder-dim')).toHaveText('(แนะนำ 800 × 1000 px)');

    // Ensure helper text "รองรับ JPG, PNG, HEIC" is removed
    const helperText = page.locator('.photo-helper-text');
    await expect(helperText).toHaveCount(0);
  });

  test('6. Student photo upload displays cover fit and removal button', async ({ page }) => {
    const fileInput = page.locator('#student-photo-input');
    const previewImg = page.locator('#student-photo-preview-img');
    const btnRemove = page.locator('#btn-remove-student-photo');
    const btnUpload = page.locator('#btn-upload-student-photo');

    // 1x1 png buffer upload
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    await fileInput.setInputFiles({
      name: 'student_test.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    await expect(previewImg).toBeVisible();
    await expect(btnRemove).toBeVisible();
    await expect(btnUpload).toHaveText(/เปลี่ยนรูป/);

    // Verify object-fit: cover
    const objectFit = await previewImg.evaluate((el) => window.getComputedStyle(el).objectFit);
    expect(objectFit).toBe('cover');

    // Click remove
    await btnRemove.click();
    await expect(previewImg).toBeHidden();
    await expect(btnRemove).toBeHidden();
    await expect(btnUpload).toHaveText(/เลือกรูปถ่าย/);
  });

  test('7. Recommendation panel is rendered with 2 bullets', async ({ page }) => {
    const reco = page.locator('.student-recommendation-card');
    await expect(reco).toBeVisible();
    await expect(reco.locator('.recommendation-badge')).toHaveText('คำแนะนำ');

    const bullets = reco.locator('.recommendation-list li');
    await expect(bullets).toHaveCount(2);
    await expect(bullets.nth(0)).toHaveText('ชื่อและนามสกุลจะถูกนำไปใช้บนหน้าปกและชื่อไฟล์เอกสารอัตโนมัติ');
    await expect(bullets.nth(1)).toHaveText('หากไม่มีรูปถ่าย ระบบจะจัดวางเลย์เอาต์หน้าปกแบบไม่มีรูปถ่ายให้อย่างสวยงาม');
  });

  test('8. Navigation to Section 2 compacts Hero banner and keeps Stepper accessible', async ({ page }) => {
    // Fill required student fields
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'พัฒนาสุข');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.fill('#student-year', '2569');

    // Click Next
    await page.click('#btn-step1-next');

    // Section 2 active
    const sec2 = page.locator('#portfolio-workspace');
    await expect(sec2).toBeVisible();

    // Hero is compact
    const hero = page.locator('#section1-hero');
    await expect(hero).toHaveClass(/is-compact/);

    // Stepper is still visible and shows step 2 active
    const stepNav = page.locator('#step-navigator');
    await expect(stepNav).toBeVisible();
    const step2 = page.locator('#step-nav-2');
    await expect(step2).toHaveClass(/is-active/);

    // Return to Section 1 via Stepper click
    await page.click('#step-nav-1');
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(hero).not.toHaveClass(/is-compact/);
  });

  test('9. Zero horizontal page overflow at 390px and 320px', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 750 });
      await page.waitForTimeout(100);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });

  test('10. Dark mode styling applies properly to Hero and cards', async ({ page }) => {
    const themeBtn = page.locator('#btn-theme-toggle');
    await themeBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const hero = page.locator('#section1-hero');
    await expect(hero).toBeVisible();

    const photoCard = page.locator('#student-photo-card');
    await expect(photoCard).toBeVisible();

    const infoCard = page.locator('#student-edit-card');
    await expect(infoCard).toBeVisible();

    // Switch back to light
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
