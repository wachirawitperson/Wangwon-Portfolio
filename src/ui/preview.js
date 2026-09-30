import { showToast } from './notifications.js';
import { projectStore } from '../portfolio/portfolio-state.js';
import { validateAndHighlightStudentForm } from './student-form.js';
import { generatePortfolioPdf, downloadGeneratedPdf } from '../portfolio/pdf-generator.js';
import { generatePortfolioPackage, downloadPortfolioPackage } from '../portfolio/package-exporter.js';

export function initPreviewActions(container) {
  if (!container) return;

  const btnPreview = container.querySelector('#btn-preview-portfolio');
  const btnExportPdf = container.querySelector('#btn-export-pdf');
  const btnExportZip = container.querySelector('#btn-export-zip');

  // Shared transient export lock to prevent concurrent heavy operations
  let currentExportTask = null; // null | 'pdf' | 'package'
  let activeAbortController = null;

  function checkValidation() {
    const { valid } = validateAndHighlightStudentForm();
    if (!valid) {
      showToast('กรุณากรอกข้อมูลนักเรียนให้ครบก่อน', 'warning');
      return false;
    }
    return true;
  }

  const spinnerSvg = `
    <svg class="icon-inline spinner-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  `;

  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
      if (!checkValidation()) return;

      const state = projectStore.getState();
      const count = (state.images || []).length;
      showToast(
        `โหมดพรีวิว: มีรูปผลงาน ${count} รูป (ปกหน้า 1 + ผลงาน ${count} + ปกหลัง 1)`,
        'info'
      );
    });
  }

  if (btnExportPdf) {
    const defaultHtml = btnExportPdf.innerHTML;

    btnExportPdf.addEventListener('click', async () => {
      if (currentExportTask !== null) return;
      if (!checkValidation()) return;

      const state = projectStore.getState();
      currentExportTask = 'pdf';
      activeAbortController = new AbortController();

      // UI visual feedback & lock both export buttons
      btnExportPdf.disabled = true;
      btnExportPdf.classList.add('is-loading');
      btnExportPdf.setAttribute('aria-busy', 'true');
      if (btnExportZip) btnExportZip.disabled = true;

      showToast('กำลังเตรียมสร้าง Portfolio PDF...', 'info');

      try {
        const result = await generatePortfolioPdf(state, {
          signal: activeAbortController.signal,
          onProgress: ({ phase, percent, current, total, message }) => {
            btnExportPdf.innerHTML = `${spinnerSvg} กำลังสร้าง (${percent}%)`;
          }
        });

        // Trigger local file download
        downloadGeneratedPdf({ blob: result.blob, filename: result.filename });

        showToast(
          `สร้างและดาวน์โหลดไฟล์ "${result.filename}" (${result.pageCount} หน้า) เรียบร้อยแล้ว`,
          'success'
        );
      } catch (err) {
        if (err.name === 'AbortError') {
          showToast('ยกเลิกการสร้าง PDF แล้ว', 'info');
        } else {
          console.error('[Wangwon PDF] Generation failed:', err);
          showToast(`เกิดข้อผิดพลาดในการสร้าง PDF: ${err.message || err}`, 'error');
        }
      } finally {
        currentExportTask = null;
        activeAbortController = null;
        btnExportPdf.disabled = false;
        btnExportPdf.classList.remove('is-loading');
        btnExportPdf.removeAttribute('aria-busy');
        btnExportPdf.innerHTML = defaultHtml;
        if (btnExportZip) btnExportZip.disabled = false;
      }
    });
  }

  if (btnExportZip) {
    const defaultHtml = btnExportZip.innerHTML;

    btnExportZip.addEventListener('click', async () => {
      if (currentExportTask !== null) return;
      if (!checkValidation()) return;

      const state = projectStore.getState();
      const imageCount = (state.images || []).length;
      if (imageCount >= 25) {
        showToast('แฟ้มนี้มีรูปจำนวนมาก การส่งออกอาจใช้เวลาสักครู่', 'info');
      }

      currentExportTask = 'package';
      activeAbortController = new AbortController();

      // UI visual feedback & lock both export buttons
      btnExportZip.disabled = true;
      btnExportZip.classList.add('is-loading');
      btnExportZip.setAttribute('aria-busy', 'true');
      if (btnExportPdf) btnExportPdf.disabled = true;

      btnExportZip.innerHTML = `${spinnerSvg} กำลังเตรียมไฟล์ (0%)`;
      showToast('กำลังเตรียมส่งออก PDF + รูปภาพ...', 'info');

      try {
        const result = await generatePortfolioPackage(state, {
          signal: activeAbortController.signal,
          onProgress: ({ percent, stage, message }) => {
            btnExportZip.innerHTML = `${spinnerSvg} กำลังส่งออก (${percent}%)`;
          }
        });

        // Trigger local file download
        downloadPortfolioPackage({ blob: result.blob, filename: result.filename });

        // Optional friendly file size display
        const sizeMb = (result.blob.size / (1024 * 1024)).toFixed(1);
        showToast(
          `ส่งออก PDF + รูปภาพเรียบร้อยแล้ว (${result.filename}, ${result.fileCount} ไฟล์, ${sizeMb} MB)`,
          'success'
        );
      } catch (err) {
        if (err.name === 'AbortError') {
          showToast('ยกเลิกการส่งออกแล้ว', 'info');
        } else {
          console.error('[Wangwon Package] Export failed:', err);
          showToast(`เกิดข้อผิดพลาดในการส่งออก: ${err.message || err}`, 'error');
        }
      } finally {
        currentExportTask = null;
        activeAbortController = null;
        btnExportZip.disabled = false;
        btnExportZip.classList.remove('is-loading');
        btnExportZip.removeAttribute('aria-busy');
        btnExportZip.innerHTML = defaultHtml;
        if (btnExportPdf) btnExportPdf.disabled = false;
      }
    });
  }
}

