import { test } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial', timeout: 60000 });

const screenshotDir = path.resolve('tests/screenshots');
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test('Capture Light Desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(screenshotDir, '01-section1-desktop-light-empty.png') });

  await page.selectOption('#student-prefix', 'ด.ช.');
  await page.fill('#student-firstname', 'กิตติพัฒน์');
  await page.fill('#student-lastname', 'วัฒนากุลชัย');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
  await page.fill('#student-number', '14');
  await page.fill('#student-year', '2569');
  await page.screenshot({ path: path.join(screenshotDir, '02-section1-desktop-light-filled.png') });

  await page.locator('#student-photo-input').setInputFiles({
    name: 'student_photo.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '03-section1-desktop-light-with-photo.png') });
});

test('Capture Dark Desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('#btn-theme-toggle');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '04-section1-desktop-dark-empty.png') });

  await page.selectOption('#student-prefix', 'ด.ญ.');
  await page.fill('#student-firstname', 'ณิชากานต์');
  await page.fill('#student-lastname', 'สมบูรณ์สุข');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 3');
  await page.fill('#student-number', '8');
  await page.fill('#student-year', '2569');
  await page.screenshot({ path: path.join(screenshotDir, '05-section1-desktop-dark-filled.png') });

  await page.locator('#student-photo-input').setInputFiles({
    name: 'student_photo.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '06-section1-desktop-dark-with-photo.png') });
});

test('Capture Tablet & Mobile', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.selectOption('#student-prefix', 'ด.ช.');
  await page.fill('#student-firstname', 'กิตติพัฒน์');
  await page.fill('#student-lastname', 'วัฒนากุลชัย');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
  await page.fill('#student-year', '2569');
  await page.screenshot({ path: path.join(screenshotDir, '07-section1-tablet-768.png') });

  // Mobile 390
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(screenshotDir, '08-section1-mobile-390-empty.png') });

  await page.selectOption('#student-prefix', 'ด.ช.');
  await page.fill('#student-firstname', 'กิตติพัฒน์');
  await page.fill('#student-lastname', 'วัฒนากุลชัย');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
  await page.fill('#student-number', '14');
  await page.fill('#student-year', '2569');
  await page.locator('#student-photo-input').setInputFiles({
    name: 'student_photo.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '09-section1-mobile-390-filled.png') });

  // Mobile 320
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(screenshotDir, '10-section1-mobile-320-empty.png') });

  await page.selectOption('#student-prefix', 'ด.ช.');
  await page.fill('#student-firstname', 'กิตติพัฒน์');
  await page.fill('#student-lastname', 'วัฒนากุลชัย');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
  await page.fill('#student-number', '14');
  await page.fill('#student-year', '2569');
  await page.locator('#student-photo-input').setInputFiles({
    name: 'student_photo.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '11-section1-mobile-320-filled.png') });
});

test('Capture Transition & Validation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Fill valid to go to section 2
  await page.selectOption('#student-prefix', 'ด.ช.');
  await page.fill('#student-firstname', 'กิตติพัฒน์');
  await page.fill('#student-lastname', 'วัฒนากุลชัย');
  await page.selectOption('#student-grade', 'ประถมศึกษาปีที่ 6');
  await page.fill('#student-year', '2569');
  await page.click('#btn-step1-next');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, '12-section2-compact-hero-transition.png') });

  // Validation
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('#btn-step1-next');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '13-section1-validation-errors.png') });
});
