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

    // Verify all 9 grade options exist in exact order (excluding placeholder option)
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
    const allOptions = await page.locator('#student-grade option').all();
    expect(allOptions.length).toBe(10); // 1 placeholder + 9 grade options

    // Check placeholder
    const firstOptionVal = await allOptions[0].getAttribute('value');
    expect(firstOptionVal).toBe('');

    const gradeOptions = allOptions.slice(1);
    expect(gradeOptions.length).toBe(9);

    const actualGradeValues = await Promise.all(gradeOptions.map((opt) => opt.getAttribute('value')));
    expect(actualGradeValues).toEqual(expectedGrades);

    const actualGradeLabels = await Promise.all(gradeOptions.map((opt) => opt.textContent()));
    expect(actualGradeLabels.map((t) => t?.trim())).toEqual(expectedGrades);

    // Verify selected value reflects correctly in app state
    await page.selectOption('#student-grade', 'อนุบาล 1');
    const stateGrade = await page.evaluate(() => window.__WANGWON_STORE__?.getState()?.student?.grade);
    expect(stateGrade).toBe('อนุบาล 1');

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

  test('21. Pure student utilities correctly normalize, format, and validate student data', async ({ page }) => {
    await page.goto('/');

    const testResults = await page.evaluate(() => {
      const utils = window.__WANGWON_STUDENT_UTILS__;
      const fnUtils = window.__WANGWON_FILENAME_UTILS__;

      // 1. Dynamic BE Academic year
      const defaultYear = utils.getDefaultAcademicYear();
      const currentYear = new Date().getFullYear();
      const expectedBE = String(currentYear + 543);

      // 2. Normalization
      const normalized = utils.normalizeStudentData({
        prefix: '  ด.ช.  ',
        firstName: '  สมชาย  ',
        lastName: '  ใจดี  ',
        grade: '  ประถมศึกษาปีที่ 1  ',
        studentNumber: '  05  ',
        academicYear: '  2569  '
      });

      // 3. Display name
      const displayName1 = utils.getStudentDisplayName({ prefix: 'ด.ช.', firstName: 'สมชาย', lastName: 'ใจดี' });
      const displayNameFallback = utils.getStudentDisplayName({});

      // 4. Filename generation
      const emptyFilename = fnUtils.generatePdfFilename({});
      const filledFilename = fnUtils.generatePdfFilename({ prefix: 'ด.ช.', firstName: 'สมชาย', lastName: 'ใจดี' });
      const sanitizedFilename = fnUtils.generatePdfFilename({ prefix: 'ด.ญ.', firstName: 'กานต์/วิภา*?', lastName: 'รัก:เรียน|' });

      // 5. Validation rules
      const invalidEmpty = utils.validateStudentInformation({});
      const invalidYearFormat = utils.validateStudentInformation({
        prefix: 'ด.ช.',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        grade: 'ประถมศึกษาปีที่ 1',
        academicYear: '256' // Only 3 digits
      });
      const validStudent = utils.validateStudentInformation({
        prefix: 'ด.ช.',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        grade: 'ประถมศึกษาปีที่ 1',
        academicYear: '2569'
      });

      return {
        defaultYear,
        expectedBE,
        normalized,
        displayName1,
        displayNameFallback,
        emptyFilename,
        filledFilename,
        sanitizedFilename,
        invalidEmpty,
        invalidYearFormat,
        validStudent
      };
    });

    expect(testResults.defaultYear).toBe(testResults.expectedBE);
    expect(testResults.normalized.firstName).toBe('สมชาย');
    expect(testResults.normalized.lastName).toBe('ใจดี');
    expect(testResults.normalized.studentNumber).toBe('05');
    expect(testResults.displayName1).toBe('ด.ช.สมชาย ใจดี');
    expect(testResults.displayNameFallback).toBe('ชื่อ-นามสกุล นักเรียน');
    expect(testResults.emptyFilename).toBe('portfolio-นักเรียน.pdf');
    expect(testResults.filledFilename).toBe('ด.ช.สมชาย_ใจดี.pdf');
    expect(testResults.sanitizedFilename).toBe('ด.ญ.กานต์วิภา_รักเรียน.pdf');

    expect(testResults.invalidEmpty.valid).toBe(false);
    expect(testResults.invalidEmpty.errors.firstName).toBe('กรุณากรอกชื่อ');
    expect(testResults.invalidEmpty.errors.lastName).toBe('กรุณากรอกนามสกุล');
    expect(testResults.invalidEmpty.errors.grade).toBe('กรุณาเลือกระดับชั้น');

    expect(testResults.invalidYearFormat.valid).toBe(false);
    expect(testResults.invalidYearFormat.errors.academicYear).toBe('กรุณากรอกปีการศึกษาเป็นตัวเลข 4 หลัก');

    expect(testResults.validStudent.valid).toBe(true);
    expect(Object.keys(testResults.validStudent.errors).length).toBe(0);
  });

  test('22. Two-way binding: Typing in form updates store and updating store updates form', async ({ page }) => {
    await page.goto('/');

    // Form inputs to store
    await page.selectOption('#student-prefix', 'ด.ญ.');
    await page.fill('#student-firstname', 'มณีรัตน์');
    await page.fill('#student-lastname', 'แก้วตา');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 2');
    await page.fill('#student-number', '12');
    await page.fill('#student-year', '2569');

    const state = await page.evaluate(() => window.__WANGWON_STORE__.getState().student);
    expect(state.prefix).toBe('ด.ญ.');
    expect(state.firstName).toBe('มณีรัตน์');
    expect(state.lastName).toBe('แก้วตา');
    expect(state.grade).toBe('ประถมศึกษาปีที่ 2');
    expect(state.studentNumber).toBe('12');
    expect(state.academicYear).toBe('2569');

    // Filename badge updates live
    const badge = page.locator('#preview-filename-badge');
    await expect(badge).toHaveText('ด.ญ.มณีรัตน์_แก้วตา.pdf');

    // Programmatic store update reflects in form
    await page.evaluate(() => {
      window.__WANGWON_STORE__.setState({
        student: {
          prefix: 'นาย',
          firstName: 'วรวัฒน์',
          lastName: 'สุขสมบูรณ์',
          grade: 'ประถมศึกษาปีที่ 6',
          studentNumber: '25',
          academicYear: '2570'
        }
      });
    });

    await expect(page.locator('#student-prefix')).toHaveValue('นาย');
    await expect(page.locator('#student-firstname')).toHaveValue('วรวัฒน์');
    await expect(page.locator('#student-lastname')).toHaveValue('สุขสมบูรณ์');
    await expect(page.locator('#student-grade')).toHaveValue('ประถมศึกษาปีที่ 6');
    await expect(page.locator('#student-number')).toHaveValue('25');
    await expect(page.locator('#student-year')).toHaveValue('2570');
    await expect(badge).toHaveText('นายวรวัฒน์_สุขสมบูรณ์.pdf');
  });

  test('23. Inline validation and ARIA attributes appear on blur and clear on input', async ({ page }) => {
    await page.goto('/');

    const firstNameInput = page.locator('#student-firstname');
    const lastNameInput = page.locator('#student-lastname');

    // Focus and blur firstName without entering text
    await firstNameInput.focus();
    await lastNameInput.focus(); // Triggers blur on firstName

    await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(firstNameInput).toHaveAttribute('aria-describedby', 'error-firstName');

    const errorMsg = page.locator('#error-firstName');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText('กรุณากรอกชื่อ');

    // Type into firstName clears error immediately
    await firstNameInput.fill('ส');
    await expect(firstNameInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(errorMsg).not.toBeVisible();
  });

  test('24. Action Gating: Preview and Export buttons require valid student info', async ({ page }) => {
    await page.goto('/');

    const previewBtn = page.locator('#btn-preview-portfolio');
    const exportBtn = page.locator('#btn-export-pdf');

    // Attempt to preview without filling required fields
    await previewBtn.click();

    // Check toast notification
    const toast = page.locator('.toast.toast-warning');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('กรุณากรอกข้อมูลนักเรียนให้ครบก่อน');

    // Check first invalid element (firstName) is focused and has error
    await expect(page.locator('#student-firstname')).toBeFocused();
    await expect(page.locator('#student-firstname')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#error-firstName')).toBeVisible();

    // Attempt export PDF also blocked
    await page.keyboard.press('Tab');
    await exportBtn.click();
    await expect(toast.first()).toBeVisible();
  });

  test('25. Reset Project Action resets student state to defaults and clears form errors', async ({ page }) => {
    await page.goto('/');

    // Fill form
    await page.fill('#student-firstname', 'ทดสอบ');
    await page.fill('#student-lastname', 'รีเซ็ต');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 3');

    // Open Reset modal
    const resetBtn = page.locator('#btn-reset-project');
    const resetModal = page.locator('#reset-confirm-modal');
    await resetBtn.click();
    await expect(resetModal).toHaveAttribute('aria-hidden', 'false');

    // Confirm reset
    const confirmBtn = page.locator('#btn-confirm-reset');
    await confirmBtn.click();
    await expect(resetModal).toHaveAttribute('aria-hidden', 'true');

    // Verify form cleared and defaults restored
    await expect(page.locator('#student-firstname')).toHaveValue('');
    await expect(page.locator('#student-lastname')).toHaveValue('');
    await expect(page.locator('#student-grade')).toHaveValue('');
    await expect(page.locator('#preview-filename-badge')).toHaveText('portfolio-นักเรียน.pdf');

    // Verify toast confirms reset
    const toast = page.locator('.toast.toast-info');
    await expect(toast.first()).toBeVisible();
    await expect(toast.first()).toContainText('เริ่มโครงการใหม่เรียบร้อยแล้ว');
  });

  test('Visual QA: Capture Phase 3 Screenshots for Empty, Completed, Validation Errors, and Reset Modal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    // 1. Empty Form Screenshot
    await page.goto('/');
    await page.screenshot({ path: 'tests/screenshots/phase3-empty-form.png', fullPage: false });

    // 2. Completed Form Screenshot
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'วัฒนากุลชัย');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 1');
    await page.fill('#student-number', '01');
    await page.screenshot({ path: 'tests/screenshots/phase3-completed-form.png', fullPage: false });

    // 3. Validation Errors Highlight Screenshot
    await page.goto('/');
    await page.locator('#btn-preview-portfolio').click();
    await page.locator('#student-section').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/screenshots/phase3-validation-errors.png', fullPage: false });

    // 4. Long Thai Student Name Screenshot
    await page.goto('/');
    await page.selectOption('#student-prefix', 'นางสาว');
    await page.fill('#student-firstname', 'ชลธิชาพัชญ์');
    await page.fill('#student-lastname', 'เกียรติบวรพาณิชย์กุล');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
    await page.screenshot({ path: 'tests/screenshots/phase3-long-name.png', fullPage: false });

    // 5. Reset Modal Open Screenshot
    await page.locator('#btn-reset-project').click();
    await page.screenshot({ path: 'tests/screenshots/phase3-reset-modal.png', fullPage: false });
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

  // =========================================================================
  // PHASE 4: Image Import, Validation, HEIC & Workspace Pipeline Tests (26-45)
  // =========================================================================

  test('26. Format Support: Imports JPG, PNG, WebP, and BMP files via file-picker', async ({ page }) => {
    await page.goto('/');

    const importResult = await page.evaluate(async () => {
      // Helper to generate canvas image file in page
      function createTestImg(name, type, w = 1200, h = 900) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, w, h);
        return new Promise((res) => {
          canvas.toBlob((blob) => {
            const f = new File([blob], name, { type, lastModified: 1700000000000 });
            res(f);
          }, type === 'image/bmp' ? 'image/png' : type);
        });
      }

      const fJpg = await createTestImg('test1.jpg', 'image/jpeg');
      const fPng = await createTestImg('test2.png', 'image/png');
      const fWebp = await createTestImg('test3.webp', 'image/webp');
      const fBmp = await createTestImg('test4.bmp', 'image/bmp');

      const res = await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([fJpg, fPng, fWebp, fBmp]);
      return {
        importedCount: res.imported.length,
        unsupportedCount: res.unsupported.length,
        storeImagesCount: window.__WANGWON_STORE__.getState().images.length
      };
    });

    expect(importResult.importedCount).toBe(4);
    expect(importResult.unsupportedCount).toBe(0);
    expect(importResult.storeImagesCount).toBe(4);

    // Verify DOM renders 4 student image cards
    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(4);

    // Verify image counter badge updates
    const imageCountBadge = page.locator('#image-count-badge');
    await expect(imageCountBadge).toHaveText('4 ภาพผลงาน');

    // Verify total pages badge updates (4 + 2 = 6)
    const totalPagesBadge = page.locator('#total-pages-badge');
    await expect(totalPagesBadge).toHaveText('6 หน้า รวมปกหน้าและปกหลัง');
  });

  test('27. Page Numbering: Front Cover is Page 1, first image is Page 2, and Back Cover is Last Page', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const f1 = new File([blob], 'art_activity1.jpg', { type: 'image/jpeg', lastModified: 1000 });
      const f2 = new File([blob], 'art_activity2.jpg', { type: 'image/jpeg', lastModified: 2000 });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([f1, f2]);
    });

    // Check Front Cover badge
    const frontBadge = page.locator('#front-cover-card .badge-locked');
    await expect(frontBadge).toContainText('หน้า 1');

    // Check Student Cards page badges (should be หน้า 2 and หน้า 3)
    const cards = page.locator('.student-image-card');
    await expect(cards.nth(0).locator('.page-badge')).toHaveText('หน้า 2');
    await expect(cards.nth(1).locator('.page-badge')).toHaveText('หน้า 3');

    // Check Back Cover badge
    const backBadge = page.locator('#back-cover-card .badge-locked');
    await expect(backBadge).toContainText('หน้าสุดท้าย');
  });

  test('28. Unsupported File Handling: Rejects non-image files and displays Thai toast warning', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const pdfBlob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], 'document.pdf', { type: 'application/pdf' });
      return await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([pdfFile]);
    });

    expect(result.imported.length).toBe(0);
    expect(result.unsupported).toContain('document.pdf');
  });

  test('29. Corrupted File Handling: Rejects unreadable files safely without halting batch', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const corruptBlob = new Blob(['not a valid image content'], { type: 'image/jpeg' });
      const corruptFile = new File([corruptBlob], 'broken.jpg', { type: 'image/jpeg' });

      // Create a valid image
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1000;
      const validBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const validFile = new File([validBlob], 'valid.png', { type: 'image/png' });

      return await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([corruptFile, validFile]);
    });

    expect(result.corrupted).toContain('broken.jpg');
    expect(result.imported.length).toBe(1);
    expect(result.imported[0].originalFilename).toBe('valid.png');
  });

  test('30. Low Resolution Warning: Detects <1200px longest edge and displays badge without blocking import', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      // 640x480 is low res (longest edge < 1200)
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const lowBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const lowFile = new File([lowBlob], 'lowres_photo.jpg', { type: 'image/jpeg' });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([lowFile]);
    });

    const card = page.locator('.student-image-card');
    await expect(card).toHaveClass(/has-warning-lowres/);

    const warningBadge = card.locator('.warning-badge-area');
    await expect(warningBadge).toBeVisible();
    await expect(warningBadge).toContainText('ความละเอียดต่ำ (640 × 480)');
  });

  test('31. High Resolution Images: Does not show low resolution warning badge', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      // 1920x1080 is standard high res
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const highBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const highFile = new File([highBlob], 'highres_photo.jpg', { type: 'image/jpeg' });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([highFile]);
    });

    const card = page.locator('.student-image-card');
    await expect(card).not.toHaveClass(/has-warning-lowres/);
    const warningBadge = card.locator('.warning-badge-area');
    await expect(warningBadge).not.toBeVisible();
  });

  test('32. Duplicate Detection: Detects identical image and presents summary modal dialog', async ({ page }) => {
    await page.goto('/');

    // First import one file
    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const f1 = new File([blob], 'science_fair.jpg', { type: 'image/jpeg', lastModified: 5000 });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([f1]);
    });

    let imagesCount = await page.evaluate(() => window.__WANGWON_STORE__.getState().images.length);
    expect(imagesCount).toBe(1);

    // Now simulate user importing the exact same file again through file input
    const fileInput = page.locator('#file-upload-input');
    await fileInput.setInputFiles({
      name: 'science_fair.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]) // dummy header
    }).catch(() => {});

    // Or test duplicate resolution dialog directly via UI pipeline
    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const dupFile = new File([blob], 'science_fair.jpg', { type: 'image/jpeg', lastModified: 5000 });
      
      // Dispatch change event with dupFile
      const input = document.querySelector('#file-upload-input');
      const dt = new DataTransfer();
      dt.items.add(dupFile);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const dupModal = page.locator('#duplicate-modal');
    await expect(dupModal).toHaveAttribute('aria-hidden', 'false');
    await expect(dupModal.locator('#duplicate-file-list')).toContainText('science_fair.jpg');

    // Test "ข้ามภาพที่ซ้ำ" (Skip duplicates)
    const btnSkip = page.locator('#btn-skip-duplicates');
    await btnSkip.click();
    await expect(dupModal).toHaveAttribute('aria-hidden', 'true');

    // Images count remains 1
    imagesCount = await page.evaluate(() => window.__WANGWON_STORE__.getState().images.length);
    expect(imagesCount).toBe(1);
  });

  test('33. Duplicate Modal: "นำเข้ารูปซ้ำทั้งหมด" imports duplicates when chosen by teacher', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const f1 = new File([blob], 'award.jpg', { type: 'image/jpeg', lastModified: 7000 });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([f1]);

      const dupFile = new File([blob], 'award.jpg', { type: 'image/jpeg', lastModified: 7000 });
      const input = document.querySelector('#file-upload-input');
      const dt = new DataTransfer();
      dt.items.add(dupFile);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const dupModal = page.locator('#duplicate-modal');
    await expect(dupModal).toHaveAttribute('aria-hidden', 'false');

    // Click Allow Duplicates
    const btnAllow = page.locator('#btn-allow-duplicates');
    await btnAllow.click();
    await expect(dupModal).toHaveAttribute('aria-hidden', 'true');

    // Wait for store to update to 2 images
    await expect.poll(async () => {
      return await page.evaluate(() => window.__WANGWON_STORE__.getState().images.length);
    }).toBe(2);
  });

  test('34. HEIC decoding integration: Gracefully decodes or handles fallback', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      // Mock window.heic2any converter
      window.heic2any = async ({ blob }) => {
        // Return simulated jpeg blob
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1200;
        return await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      };

      const heicBlob = new Blob(['mock-heic-binary'], { type: 'image/heic' });
      const heicFile = new File([heicBlob], 'iphone_photo.heic', { type: 'image/heic' });

      return await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([heicFile]);
    });

    expect(result.imported.length).toBe(1);
    expect(result.imported[0].outputExtension).toBe('jpg');
    expect(result.imported[0].width).toBe(1600);
    expect(result.imported[0].height).toBe(1200);
  });

  test('35. Drag-and-Drop: Workspace shows .is-dragover feedback and imports dropped files', async ({ page }) => {
    await page.goto('/');

    const workspace = page.locator('#portfolio-workspace');
    await expect(workspace).toBeVisible();

    // Trigger dragover on workspace inside evaluate
    await page.evaluate(() => {
      const ws = document.querySelector('#portfolio-workspace');
      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      ws.dispatchEvent(dragOverEvent);
    });
    await expect(workspace).toHaveClass(/is-dragover/);

    // Trigger dragleave inside evaluate
    await page.evaluate(() => {
      const ws = document.querySelector('#portfolio-workspace');
      const dragLeaveEvent = new Event('dragleave', { bubbles: true, cancelable: true });
      ws.dispatchEvent(dragLeaveEvent);
    });
    await expect(workspace).not.toHaveClass(/is-dragover/);

    // Trigger drop with synthesized images
    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1000;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const dropFile = new File([blob], 'dragged_image.png', { type: 'image/png', lastModified: 9000 });

      const dt = new DataTransfer();
      dt.items.add(dropFile);

      const ws = document.querySelector('#portfolio-workspace');
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
      });
      ws.dispatchEvent(dropEvent);
    });

    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.image-name')).toHaveText('dragged_image.png');
  });

  test('36. Clipboard Paste: Pasting image anywhere outside text input imports student image', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const pasteFile = new File([blob], 'clipboard_image.png', { type: 'image/png', lastModified: 9500 });

      const dt = new DataTransfer();
      dt.items.add(pasteFile);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });
      window.dispatchEvent(pasteEvent);
    });

    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.image-name')).toHaveText('clipboard_image.png');
  });

  test('37. Clipboard Paste Guard: Does not intercept paste when activeElement is text input', async ({ page }) => {
    await page.goto('/');

    const firstNameInput = page.locator('#student-firstname');
    await firstNameInput.focus();

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const pasteFile = new File([blob], 'should_not_import.png', { type: 'image/png' });

      const dt = new DataTransfer();
      dt.items.add(pasteFile);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt
      });
      window.dispatchEvent(pasteEvent);
    });

    const cards = page.locator('.student-image-card');
    await expect(cards).toHaveCount(0);
  });

  test('38. Image Item Schema: Conforms to all required fields in store', async ({ page }) => {
    await page.goto('/');

    const imageItem = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1000;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const file = new File([blob], 'schema_test.jpg', { type: 'image/jpeg' });
      const res = await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([file], { source: 'drag-drop' });
      return res.imported[0];
    });

    expect(imageItem).toBeDefined();
    expect(typeof imageItem.id).toBe('string');
    expect(imageItem.originalFilename).toBe('schema_test.jpg');
    expect(imageItem.outputExtension).toBe('jpg');
    expect(imageItem.mimeType).toBe('image/jpeg');
    expect(imageItem.order).toBe(1);
    expect(imageItem.rotation).toBe(0);
    expect(imageItem.width).toBe(1400);
    expect(imageItem.height).toBe(1000);
    expect(imageItem.aspectRatio).toBe(1.4);
    expect(imageItem.source).toBe('drag-drop');
    expect(imageItem.qualityStatus).toBe('normal');
    expect(typeof imageItem.duplicateKey).toBe('string');
    expect(imageItem.previewUrl.startsWith('blob:')).toBe(true);
  });

  test('39. Memory Cleanup: resetPortfolioProject revokes all active preview URLs', async ({ page }) => {
    await page.goto('/');

    const revokedUrls = await page.evaluate(async () => {
      const revoked = [];
      const origRevoke = URL.revokeObjectURL;
      URL.revokeObjectURL = (url) => {
        revoked.push(url);
        origRevoke(url);
      };

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const file = new File([blob], 'cleanup_test.jpg', { type: 'image/jpeg' });

      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([file]);
      const currentUrl = window.__WANGWON_STORE__.getState().images[0].previewUrl;

      // Now reset
      window.__WANGWON_STUDENT_UTILS__.resetPortfolioProject();

      return {
        createdUrl: currentUrl,
        revokedUrls: revoked
      };
    });

    expect(revokedUrls.revokedUrls).toContain(revokedUrls.createdUrl);
    const remainingImages = await page.evaluate(() => window.__WANGWON_STORE__.getState().images.length);
    expect(remainingImages).toBe(0);
  });

  test('40. Privacy Verification: Zero external network requests with image data', async ({ page }) => {
    const externalRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');

    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg'));
      const file = new File([blob], 'confidential_student.jpg', { type: 'image/jpeg' });
      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([file]);
    });

    expect(externalRequests).toEqual([]);
  });

  test('Visual QA: Capture Phase 4 Screenshots for Workspace with Images, Low-res, and Duplicate Modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // 1. Fill student info
    await page.selectOption('#student-prefix', 'ด.ช.');
    await page.fill('#student-firstname', 'กิตติพัฒน์');
    await page.fill('#student-lastname', 'วัฒนากุลชัย');
    await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 1');
    await page.fill('#student-number', '01');

    // 2. Import high-res & low-res images
    await page.evaluate(async () => {
      // Normal image
      const canvasNorm = document.createElement('canvas');
      canvasNorm.width = 1600;
      canvasNorm.height = 1200;
      const ctx1 = canvasNorm.getContext('2d');
      ctx1.fillStyle = '#0284c7';
      ctx1.fillRect(0, 0, 1600, 1200);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '48px sans-serif';
      ctx1.fillText('กิจกรรมวันวิทยาศาสตร์', 100, 200);
      const blob1 = await new Promise((res) => canvasNorm.toBlob(res, 'image/jpeg'));
      const f1 = new File([blob1], 'science_activity.jpg', { type: 'image/jpeg', lastModified: 1000 });

      // Low res image
      const canvasLow = document.createElement('canvas');
      canvasLow.width = 640;
      canvasLow.height = 480;
      const ctx2 = canvasLow.getContext('2d');
      ctx2.fillStyle = '#f59e0b';
      ctx2.fillRect(0, 0, 640, 480);
      ctx2.fillStyle = '#ffffff';
      ctx2.font = '32px sans-serif';
      ctx2.fillText('ภาพถ่ายขนาดเล็ก', 50, 100);
      const blob2 = await new Promise((res) => canvasLow.toBlob(res, 'image/jpeg'));
      const f2 = new File([blob2], 'drawing_craft.jpg', { type: 'image/jpeg', lastModified: 2000 });

      await window.__WANGWON_IMAGE_MANAGER__.importStudentImages([f1, f2]);
    });

    // Capture Workspace with imported images
    await page.locator('#portfolio-workspace').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/screenshots/phase4-workspace-images.png', fullPage: false });

    // Open Duplicate Modal and capture
    await page.evaluate(async () => {
      const dupModal = document.querySelector('#duplicate-modal');
      const dupSummary = document.querySelector('#duplicate-summary-text');
      const dupList = document.querySelector('#duplicate-file-list');
      if (dupSummary) dupSummary.textContent = 'พบรูปภาพ 1 ภาพที่มีชื่อหรือขนาดตรงกับภาพในระบบแล้ว:';
      if (dupList) dupList.innerHTML = '<li><strong>science_activity.jpg</strong> (ตรงกับ: science_activity.jpg)</li>';
      window.__WANGWON_MODAL__.openModal(dupModal);
    });
    await page.screenshot({ path: 'tests/screenshots/phase4-duplicate-modal.png', fullPage: false });
  });

});

