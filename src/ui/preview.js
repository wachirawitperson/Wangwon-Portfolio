/**
 * Preview Modal & Action Controls Component
 * Provides preview modal trigger and export placeholder handlers
 * gated with accessible student information validation.
 */
import { showToast } from './notifications.js';
import { projectStore } from '../portfolio/portfolio-state.js';
import { validateAndHighlightStudentForm } from './student-form.js';

export function initPreviewActions(container) {
  if (!container) return;

  const btnPreview = container.querySelector('#btn-preview-portfolio');
  const btnExportPdf = container.querySelector('#btn-export-pdf');
  const btnExportZip = container.querySelector('#btn-export-zip');

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
    btnExportPdf.addEventListener('click', () => {
      if (!checkValidation()) return;

      const state = projectStore.getState();
      const filename = state.output?.filename || 'portfolio-นักเรียน.pdf';
      showToast(
        `เตรียมสร้างไฟล์ PDF: "${filename}" (ระบบจะเปิดให้ดาวน์โหลดเต็มรูปแบบใน Phase 5)`,
        'info'
      );
    });
  }

  if (btnExportZip) {
    btnExportZip.addEventListener('click', () => {
      if (!checkValidation()) return;

      showToast(
        'เตรียมส่งออก ZIP Package (PDF + รูปภาพเปลี่ยนชื่อ) จะพร้อมใช้งานใน Phase 6',
        'info'
      );
    });
  }
}
