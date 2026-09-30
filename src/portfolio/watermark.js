/**
 * Watermark Architecture & Options (Phase 8)
 * Defines source types, positions, targets, and coordinate calculation.
 */

/**
 * Path to the bundled Ban Wangwon School logo used as the default watermark.
 */
export const SCHOOL_LOGO_PATH = './assets/branding/ban-wangwon-logo.png';

/**
 * Valid watermark source types.
 */
export const WATERMARK_SOURCE_TYPES = [
  { id: 'none', label: 'ไม่มีลายน้ำ (None)' },
  { id: 'school-logo', label: 'ตราโรงเรียนบ้านวังวน (School Logo)' },
  { id: 'custom', label: 'อัปโหลดลายน้ำเอง (Custom)' }
];

/**
 * 9-position grid for watermark placement.
 */
export const WATERMARK_POSITIONS = [
  { id: 'top-left', label: 'บนซ้าย (Top Left)' },
  { id: 'top-center', label: 'บนกลาง (Top Center)' },
  { id: 'top-right', label: 'บนขวา (Top Right)' },
  { id: 'middle-left', label: 'กลางซ้าย (Middle Left)' },
  { id: 'center', label: 'ตรงกลาง (Center)' },
  { id: 'middle-right', label: 'กลางขวา (Middle Right)' },
  { id: 'bottom-left', label: 'ล่างซ้าย (Bottom Left)' },
  { id: 'bottom-center', label: 'ล่างกลาง (Bottom Center)' },
  { id: 'bottom-right', label: 'ล่างขวา (Bottom Right)' }
];

/**
 * Watermark apply-to targets.
 *
 * NOTE: 'activity-only' and 'exclude-covers' currently produce the same visible
 * result because the document only has covers + activity pages. They are kept as
 * distinct semantic values for future extensibility (e.g., section dividers,
 * appendix pages). Phase 9 PDF generation will use these to decide per-page
 * watermark application.
 */
export const WATERMARK_TARGETS = [
  { id: 'all-pages', label: 'ทุกหน้ารวมปก (All Pages)' },
  { id: 'activity-only', label: 'เฉพาะรูปผลงานนักเรียน (Activity Only)' },
  { id: 'exclude-covers', label: 'ยกเว้นหน้าปก (Exclude Covers)' }
];

/**
 * Calculates coordinate offset for placing a watermark on a page canvas or PDF.
 *
 * @param {object} params
 * @param {number} params.pageWidth
 * @param {number} params.pageHeight
 * @param {number} params.watermarkWidth
 * @param {number} params.watermarkHeight
 * @param {string} params.position
 * @param {number} params.margin - Edge margin in px (default 20)
 * @returns {{ x: number, y: number }}
 */
export function calculateWatermarkCoordinates({
  pageWidth,
  pageHeight,
  watermarkWidth,
  watermarkHeight,
  position = 'bottom-right',
  margin = 20
}) {
  let x = (pageWidth - watermarkWidth) / 2;
  let y = (pageHeight - watermarkHeight) / 2;

  switch (position) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-center':
      x = (pageWidth - watermarkWidth) / 2;
      y = margin;
      break;
    case 'top-right':
      x = pageWidth - watermarkWidth - margin;
      y = margin;
      break;
    case 'middle-left':
      x = margin;
      y = (pageHeight - watermarkHeight) / 2;
      break;
    case 'center':
      x = (pageWidth - watermarkWidth) / 2;
      y = (pageHeight - watermarkHeight) / 2;
      break;
    case 'middle-right':
      x = pageWidth - watermarkWidth - margin;
      y = (pageHeight - watermarkHeight) / 2;
      break;
    case 'bottom-left':
      x = margin;
      y = pageHeight - watermarkHeight - margin;
      break;
    case 'bottom-center':
      x = (pageWidth - watermarkWidth) / 2;
      y = pageHeight - watermarkHeight - margin;
      break;
    case 'bottom-right':
      x = pageWidth - watermarkWidth - margin;
      y = pageHeight - watermarkHeight - margin;
      break;
  }

  return { x, y };
}
