/**
 * Image processing and manipulation utilities
 */

/**
 * Creates an object URL for a given File or Blob and tracks for memory management.
 * @param {Blob|File} blob
 * @returns {string} Object URL
 */
export function createPreviewUrl(blob) {
  if (!blob) return '';
  return URL.createObjectURL(blob);
}

/**
 * Safely revokes an object URL to prevent memory leaks.
 * @param {string} url
 */
export function revokePreviewUrl(url) {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Normalizes rotation angle into 0, 90, 180, or 270 degrees.
 * @param {number} angle
 * @returns {number}
 */
export function normalizeRotation(angle = 0) {
  const normalized = ((angle % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(normalized) ? normalized : 0;
}

/**
 * Calculates page dimensions and image scaling based on placement ('fit' or 'fill').
 *
 * @param {object} params
 * @param {number} params.imageWidth
 * @param {number} params.imageHeight
 * @param {number} params.pageWidth
 * @param {number} params.pageHeight
 * @param {'fit'|'fill'} params.placement
 * @returns {{ width: number, height: number, x: number, y: number }}
 */
export function calculateImagePlacement({
  imageWidth,
  imageHeight,
  pageWidth,
  pageHeight,
  placement = 'fit'
}) {
  if (!imageWidth || !imageHeight || !pageWidth || !pageHeight) {
    return { width: pageWidth, height: pageHeight, x: 0, y: 0 };
  }

  const imageAspect = imageWidth / imageHeight;
  const pageAspect = pageWidth / pageHeight;

  let width = pageWidth;
  let height = pageHeight;

  if (placement === 'fill') {
    if (imageAspect > pageAspect) {
      height = pageHeight;
      width = pageHeight * imageAspect;
    } else {
      width = pageWidth;
      height = pageWidth / imageAspect;
    }
  } else {
    // default: fit
    if (imageAspect > pageAspect) {
      width = pageWidth;
      height = pageWidth / imageAspect;
    } else {
      height = pageHeight;
      width = pageHeight * imageAspect;
    }
  }

  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;

  return { width, height, x, y };
}
