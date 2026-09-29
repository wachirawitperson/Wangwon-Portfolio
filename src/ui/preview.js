/**
 * Preview Modal & Action Controls Component
 * Provides preview modal trigger and export placeholder handlers.
 */
import { showToast } from './notifications.js';
import { projectStore } from '../portfolio/portfolio-state.js';

export function initPreviewActions(container) {
  if (!container) return;

  const btnPreview = container.querySelector('#btn-preview-portfolio');
  const btnExportPdf = container.querySelector('#btn-export-pdf');
  const btnExportZip = container.querySelector('#btn-export-zip');

  if (btnPreview) {
    btnPreview.addEventListener('click', () => {
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
      const state = projectStore.getState();
      const filename = state.output?.filename || 'portfolio.pdf';
      showToast(
        `เตรียมสร้างไฟล์ PDF: "${filename}" (ระบบจะเปิดให้ดาวน์โหลดเต็มรูปแบบใน Phase 3)`,
        'info'
      );
    });
  }

  if (btnExportZip) {
    btnExportZip.addEventListener('click', () => {
      showToast(
        'เตรียมส่งออก ZIP Package (PDF + รูปภาพเปลี่ยนชื่อ) จะพร้อมใช้งานใน Phase 4',
        'info'
      );
    });
  }
}
