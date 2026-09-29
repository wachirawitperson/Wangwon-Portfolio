/**
 * Watermark Architecture & Options
 * Defines options, positions, and calculation hooks for future watermark rendering.
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

export const WATERMARK_TARGETS = [
  { id: 'student-images', label: 'เฉพาะรูปผลงานนักเรียน (ไม่รวมปก)' },
  { id: 'all', label: 'ทุกหน้ารวมปก (All Pages)' },
  { id: 'exclude-covers', label: 'ยกเว้นหน้าปกหน้าและปกหลัง' }
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
 * @param {number} params.margin
 * @returns {{ x: number, y: number }}
 */
export function calculateWatermarkCoordinates({
  pageWidth,
  pageHeight,
  watermarkWidth,
  watermarkHeight,
  position = 'center',
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
