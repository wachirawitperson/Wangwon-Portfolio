import { test, expect } from '@playwright/test';

test.describe('Phase 16 — Section 1: Student Information UX', () => {

  test('1. Primary navigation button label is exactly "หน้าถัดไป"', async ({ page }) => {
    await page.goto('/');
    const nextBtn = page.locator('#btn-step1-next');
    await expect(nextBtn).toBeVisible();
    
    // Check exact trimmed text content (excluding nested SVG elements)
    const btnText = await nextBtn.evaluate((el) => {
      // Clone and remove SVGs to inspect exact text node
      const clone = el.cloneNode(true);
      clone.querySelectorAll('svg').forEach(s => s.remove());
      return clone.textContent.trim();
    });
    expect(btnText).toBe('หน้าถัดไป');
  });

  test('2. Required fields block forward navigation when invalid with field-level errors', async ({ page }) => {
    await page.goto('/');
    const nextBtn = page.locator('#btn-step1-next');
    
    // Attempt navigation with empty required fields
    await nextBtn.click();

    // Verify user is still on Section 1
    await expect(page.locator('#student-section')).toBeVisible();
    await expect(page.locator('#portfolio-workspace')).toBeHidden();

    // Verify field-level error messages exist near invalid inputs
    const firstNameInput = page.locator('#student-firstname');
    const lastNameInput = page.locator('#student-lastname');
    const gradeSelect = page.locator('#student-grade');

    await expect(firstNameInput).toHaveClass(/is-invalid/);
    await expect(lastNameInput).toHaveClass(/is-invalid/);
    await expect(gradeSelect).toHaveClass(/is-invalid/);

    const firstNameError = page.locator('#error-firstName');
    await expect(firstNameError).toBeVisible();
    await expect(firstNameError).toHaveText(/กรุณากรอกชื่อ/);

    // Verify first invalid input is focused
    await expect(firstNameInput).toBeFocused();
  });

  test('3. Valid student information allows forward navigation to Section 2', async ({ page }) => {
    await page.goto('/');
    
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'ชานนท์');
    await page.fill('#student-lastname', 'มีชัย');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 2');
    await page.fill('#student-number', '7');
    await page.fill('#student-year', '2569');

    await page.click('#btn-step1-next');

    // Should successfully navigate to Section 2
    await expect(page.locator('#student-section')).toBeHidden();
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // Step 2 should be active in Stepper
    await expect(page.locator('#step-nav-2')).toHaveClass(/is-active/);
    await expect(page.locator('#step-nav-1')).toHaveClass(/is-completed/);
  });

  test('4. No document/export buttons or actions exist in Section 1', async ({ page }) => {
    await page.goto('/');
    const sec1 = page.locator('#student-section');

    // Section 1 should NOT contain PDF export, ZIP export, or document preview buttons
    await expect(sec1.locator('#btn-export-pdf')).toHaveCount(0);
    await expect(sec1.locator('#btn-export-zip')).toHaveCount(0);
    await expect(sec1.locator('#btn-preview-portfolio')).toHaveCount(0);
    await expect(sec1.locator('#btn-generate-pdf')).toHaveCount(0);
  });

  test('5. Visible filename preview bar is not displayed in Section 1', async ({ page }) => {
    await page.goto('/');
    const sec1 = page.locator('#student-section');

    // Live filename preview bar should be removed from Section 1
    await expect(sec1.locator('.student-filename-preview-bar')).toHaveCount(0);
    await expect(sec1.locator('#preview-filename-badge')).toHaveCount(0);
  });

  test('6. Redundant "ดูสรุปข้อมูล" collapsible toggle is removed from Section 1', async ({ page }) => {
    await page.goto('/');
    const sec1 = page.locator('#student-section');

    // "ดูสรุปข้อมูล" button and summary card must not exist in Section 1
    await expect(sec1.locator('#btn-collapse-student')).toHaveCount(0);
    await expect(sec1.locator('#student-summary-card')).toHaveCount(0);
  });

  test('7. Student photo is optional and stays separate from activity images', async ({ page }) => {
    await page.goto('/');

    // Form can be submitted and completed without a student photo
    await page.selectOption('#student-prefix', 'ด.ญ.');
    await page.fill('#student-firstname', 'พิมพ์มาดา');
    await page.fill('#student-lastname', 'แก้วตา');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 4');
    await page.fill('#student-year', '2569');

    await page.click('#btn-step1-next');
    await expect(page.locator('#portfolio-workspace')).toBeVisible();

    // Verify activity image count remains 0 in projectStore
    const imageCount = await page.evaluate(() => {
      // @ts-ignore
      const state = window.wangwonStore ? window.wangwonStore.getState() : null;
      return state ? state.images.length : 0;
    });
    expect(imageCount).toBe(0);
  });

  test('8. Student photo upload displays preview and allows removal', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('#student-photo-input');
    const uploadBtn = page.locator('#btn-upload-student-photo');
    const removeBtn = page.locator('#btn-remove-student-photo');
    const previewImg = page.locator('#student-photo-preview-img');
    const placeholder = page.locator('#student-photo-placeholder');

    await expect(placeholder).toBeVisible();
    await expect(previewImg).toBeHidden();
    await expect(removeBtn).toBeHidden();

    // Create a 1x1 test PNG buffer and upload
    const testPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fileInput.setInputFiles({
      name: 'student-portrait.png',
      mimeType: 'image/png',
      buffer: testPngBuffer
    });

    await expect(previewImg).toBeVisible();
    await expect(placeholder).toBeHidden();
    await expect(removeBtn).toBeVisible();
    await expect(uploadBtn).toHaveText(/เปลี่ยนรูป/);

    // Remove the photo
    await removeBtn.click();
    await expect(previewImg).toBeHidden();
    await expect(placeholder).toBeVisible();
    await expect(removeBtn).toBeHidden();
    await expect(uploadBtn).toHaveText(/เลือกรูปถ่าย/);
  });

  test('9. Student number is never zero-padded and preserves user input', async ({ page }) => {
    await page.goto('/');
    const numberInput = page.locator('#student-number');

    await numberInput.fill('7');
    await expect(numberInput).toHaveValue('7');

    await numberInput.fill('12');
    await expect(numberInput).toHaveValue('12');

    // Blur does not reformat to 07 or 012
    await numberInput.blur();
    await expect(numberInput).toHaveValue('12');
  });

  test('10. Exact grade options remain intact', async ({ page }) => {
    await page.goto('/');
    const gradeSelect = page.locator('#student-grade');
    const options = await gradeSelect.locator('option').allTextContents();

    const expectedGrades = [
      'อนุบาล 1',
      'อนุบาล 2',
      'อนุบาล 3',
      'ประถมศึกษาปีที่ 1',
      'ประถมศึกษาปีที่ 2',
      'ประถมศึกษาปีที่ 3',
      'ประถมศึกษาปีที่ 4',
      'ประถมศึกษาปีที่ 5',
      'ประถมศึกษาปีที่ 6'
    ];

    for (const grade of expectedGrades) {
      expect(options).toContain(grade);
    }
  });

  test('11. Keyboard tab order follows logical visual order', async ({ page }) => {
    await page.goto('/');

    const uploadBtn = page.locator('#btn-upload-student-photo');
    const prefix = page.locator('#student-prefix');
    const first = page.locator('#student-firstname');
    const last = page.locator('#student-lastname');
    const grade = page.locator('#student-grade');
    const number = page.locator('#student-number');
    const year = page.locator('#student-year');
    const nextBtn = page.locator('#btn-step1-next');

    // Focus first input and tab through
    await prefix.focus();
    await expect(prefix).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(last).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(grade).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(number).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(year).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(nextBtn).toBeFocused();
  });

  test('12. Mobile touch target sizes: Section 1 controls meet min-target standard (~44x44px)', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const uploadBtn = page.locator('#btn-upload-student-photo');
      const uploadBox = await uploadBtn.boundingBox();
      expect(uploadBox).not.toBeNull();
      expect(uploadBox.height).toBeGreaterThanOrEqual(43.5);

      const nextBtn = page.locator('#btn-step1-next');
      const nextBox = await nextBtn.boundingBox();
      expect(nextBox).not.toBeNull();
      expect(nextBox.height).toBeGreaterThanOrEqual(43.5);

      const prefix = page.locator('#student-prefix');
      const prefixBox = await prefix.boundingBox();
      expect(prefixBox).not.toBeNull();
      expect(prefixBox.height).toBeGreaterThanOrEqual(43.5);

      const first = page.locator('#student-firstname');
      const firstBox = await first.boundingBox();
      expect(firstBox).not.toBeNull();
      expect(firstBox.height).toBeGreaterThanOrEqual(43.5);
    }
  });

  test('13. Responsive layout: Zero horizontal overflow at 320px and 390px in Section 1', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('14. Section 1 functions and displays properly in Light and Dark themes', async ({ page }) => {
    await page.goto('/');

    // Light mode verification
    const lightBg = await page.locator('#student-section').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(lightBg).not.toBe('');

    // Toggle to Dark Mode
    await page.click('#btn-theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const darkBg = await page.locator('#student-section').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(darkBg).not.toBe(lightBg);

    // Form inputs remain fully functional in dark mode
    await page.fill('#student-firstname', 'ธีรภัทร');
    await expect(page.locator('#student-firstname')).toHaveValue('ธีรภัทร');
  });

});
