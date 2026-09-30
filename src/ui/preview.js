/**
 * Preview Modal & Action Controls Component
 * Provides preview modal trigger and export placeholder handlers
 * gated with accessible student information validation.
 */
import { showToast } from './notifications.js';
import { projectStore } from '../portfolio/portfolio-state.js';
import { validateAndHighlightStudentForm } from './student-form.js';
import { generatePortfolioPdf, downloadGeneratedPdf } from '../portfolio/pdf-generator.js';

export function initPreviewActions(container) {
  if (!container) return;

  const btnPreview = container.querySelector('#btn-preview-portfolio');
  const btnExportPdf = container.querySelector('#btn-export-pdf');
  const btnExportZip = container.querySelector('#btn-export-zip');

  let isGeneratingPdf = false;
  let activeAbortController = null;

  function checkValidation() {
    const { valid } = validateAndHighlightStudentForm();
    if (!valid) {
      showToast('กรุณากรอกข้อมูลนักเรียนให้ครบก่อน', 'warning');
      return false;
    }
    return true;
  }

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
      if (isGeneratingPdf) return;
      if (!checkValidation()) return;

      const state = projectStore.getState();
      isGeneratingPdf = true;
      activeAbortController = new AbortController();

      // UI visual feedback
      btnExportPdf.disabled = true;
      btnExportPdf.classList.add('is-loading');
      btnExportPdf.setAttribute('aria-busy', 'true');

      const spinnerHtml = `
        <svg class="icon-inline spinner-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      `;

      showToast('กำลังเตรียมสร้าง Portfolio PDF...', 'info');

      try {
        const result = await generatePortfolioPdf(state, {
          signal: activeAbortController.signal,
          onProgress: ({ phase, percent, current, total, message }) => {
            btnExportPdf.innerHTML = `${spinnerHtml} กำลังสร้าง (${percent}%)`;
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
        isGeneratingPdf = false;
        activeAbortController = null;
        btnExportPdf.disabled = false;
        btnExportPdf.classList.remove('is-loading');
        btnExportPdf.removeAttribute('aria-busy');
        btnExportPdf.innerHTML = defaultHtml;
      }
    });
  }

  if (btnExportZip) {
    btnExportZip.addEventListener('click', () => {
      if (!checkValidation()) return;

      showToast(
        'เตรียมส่งออก ZIP Package (PDF + รูปภาพเปลี่ยนชื่อ) จะพร้อมใช้งานใน Phase 11',
        'info'
      );
    });
  }
}
