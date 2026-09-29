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

});

