/**
 * Watermark Renderer Module (Phase 8)
 *
 * Reusable renderer for watermark preview overlays and Phase 9 PDF canvas stamping.
 * This module is the single source of truth for:
 * - Loading watermark images (school logo or custom)
 * - Calculating watermark layout (position, scale)
 * - Rendering watermark on HTML5 Canvas
 * - Generating CSS styles for workspace preview overlays
 * - Deciding whether a watermark should appear on a given page type
 */
import { SCHOOL_LOGO_PATH, calculateWatermarkCoordinates } from './watermark.js';

// Cache loaded watermark images to avoid repeated network/blob requests
let cachedSchoolLogoImg = null;
let cachedCustomImg = null;
let cachedCustomUrl = null;

/**
 * Loads a watermark image based on watermark state.
 * Returns a cached HTMLImageElement when possible.
 *
 * @param {object} watermarkState - The watermark state from projectStore
 * @returns {Promise<HTMLImageElement|null>} Loaded image or null if sourceType is 'none'
 */
export async function loadWatermarkImage(watermarkState) {
  if (!watermarkState || watermarkState.sourceType === 'none') {
    return null;
  }

  if (watermarkState.sourceType === 'school-logo') {
    if (cachedSchoolLogoImg) return cachedSchoolLogoImg;
    const img = await loadImage(SCHOOL_LOGO_PATH);
    cachedSchoolLogoImg = img;
    return img;
  }

  if (watermarkState.sourceType === 'custom') {
    const customUrl = watermarkState.custom?.previewUrl;
    if (!customUrl) return null;

    // Return cached if URL hasn't changed
    if (cachedCustomImg && cachedCustomUrl === customUrl) {
      return cachedCustomImg;
    }

    const img = await loadImage(customUrl);
    cachedCustomImg = img;
    cachedCustomUrl = customUrl;
    return img;
  }

  return null;
}

/**
 * Loads an image from a URL. Returns a Promise resolving to an HTMLImageElement.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load watermark image: ${src}`));
    img.src = src;
  });
}

/**
 * Calculates watermark layout dimensions and position within a page.
 *
 * @param {object} params
 * @param {number} params.pageWidth - Page/container width in px
 * @param {number} params.pageHeight - Page/container height in px
 * @param {number} params.watermarkNaturalWidth - Natural width of watermark image
 * @param {number} params.watermarkNaturalHeight - Natural height of watermark image
 * @param {number} params.scale - Scale ratio (0.08–0.40, fraction of page width)
 * @param {string} params.position - One of 9 grid positions
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function calculateWatermarkLayout({
  pageWidth,
  pageHeight,
  watermarkNaturalWidth,
  watermarkNaturalHeight,
  scale = 0.18,
  position = 'bottom-right'
}) {
  if (!watermarkNaturalWidth || !watermarkNaturalHeight || !pageWidth || !pageHeight) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // Calculate watermark size based on scale (fraction of page width)
  const wmWidth = pageWidth * scale;
  const aspectRatio = watermarkNaturalWidth / watermarkNaturalHeight;
  const wmHeight = wmWidth / aspectRatio;

  // Calculate position using existing coordinate calculator
  const margin = Math.max(pageWidth * 0.03, 8); // 3% of page width, min 8px
  const coords = calculateWatermarkCoordinates({
    pageWidth,
    pageHeight,
    watermarkWidth: wmWidth,
    watermarkHeight: wmHeight,
    position,
    margin
  });

  return {
    x: coords.x,
    y: coords.y,
    width: wmWidth,
    height: wmHeight
  };
}

/**
 * Renders a watermark onto a 2D canvas context.
 * Used by Phase 9 PDF generation engine.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} watermarkImage
 * @param {{ x: number, y: number, width: number, height: number }} layout
 * @param {number} opacity - 0.0 to 1.0
 */
export function renderWatermarkOnCanvas(ctx, watermarkImage, layout, opacity = 0.18) {
  if (!ctx || !watermarkImage || !layout) return;

  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = opacity;
  ctx.drawImage(watermarkImage, layout.x, layout.y, layout.width, layout.height);
  ctx.globalAlpha = prevAlpha;
}

/**
 * Generates inline CSS style properties for a watermark overlay <img> element
 * positioned inside a page preview container.
 *
 * @param {object} watermarkState - The watermark state from projectStore
 * @param {number} containerWidth - Container width in px
 * @param {number} containerHeight - Container height in px
 * @param {number} [naturalWidth] - Natural width of watermark image (for aspect ratio)
 * @param {number} [naturalHeight] - Natural height of watermark image
 * @returns {object} CSS style properties { display, opacity, width, left, top, ... }
 */
export function getWatermarkCssOverlayStyle(watermarkState, containerWidth, containerHeight, naturalWidth, naturalHeight) {
  if (!watermarkState || !watermarkState.enabled || watermarkState.sourceType === 'none') {
    return { display: 'none' };
  }

  // Determine natural dimensions
  let wmNatW = naturalWidth;
  let wmNatH = naturalHeight;

  if (watermarkState.sourceType === 'custom' && watermarkState.custom) {
    wmNatW = wmNatW || watermarkState.custom.width || 100;
    wmNatH = wmNatH || watermarkState.custom.height || 100;
  }

  // Default fallback for school logo
  if (!wmNatW || !wmNatH) {
    wmNatW = 200;
    wmNatH = 200;
  }

  const layout = calculateWatermarkLayout({
    pageWidth: containerWidth,
    pageHeight: containerHeight,
    watermarkNaturalWidth: wmNatW,
    watermarkNaturalHeight: wmNatH,
    scale: watermarkState.scale || 0.18,
    position: watermarkState.position || 'bottom-right'
  });

  return {
    display: 'block',
    position: 'absolute',
    left: `${layout.x}px`,
    top: `${layout.y}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    opacity: String(watermarkState.opacity || 0.18),
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: '2'
  };
}

/**
 * Returns the image source URL for the current watermark state.
 *
 * @param {object} watermarkState
 * @returns {string|null}
 */
export function getWatermarkImageSrc(watermarkState) {
  if (!watermarkState || watermarkState.sourceType === 'none') return null;
  if (watermarkState.sourceType === 'school-logo') return SCHOOL_LOGO_PATH;
  if (watermarkState.sourceType === 'custom') return watermarkState.custom?.previewUrl || null;
  return null;
}

/**
 * Decides whether a watermark should appear on a given page type
 * based on the applyTo setting.
 *
 * NOTE: 'activity-only' and 'exclude-covers' currently produce the same
 * visible result because the document only has covers + activity pages.
 * They are kept as distinct semantic values for future extensibility.
 *
 * @param {string} applyTo - 'all-pages' | 'activity-only' | 'exclude-covers'
 * @param {string} pageType - 'front-cover' | 'back-cover' | 'activity'
 * @returns {boolean}
 */
export function shouldApplyWatermark(applyTo, pageType) {
  if (!applyTo || !pageType) return false;

  switch (applyTo) {
    case 'all-pages':
      return true;

    case 'activity-only':
      return pageType === 'activity';

    case 'exclude-covers':
      // Exclude front-cover and back-cover, include everything else (activity)
      return pageType !== 'front-cover' && pageType !== 'back-cover';

    default:
      return false;
  }
}

/**
 * Invalidates the cached custom watermark image.
 * Called when custom watermark is removed or replaced.
 */
export function invalidateCustomCache() {
  cachedCustomImg = null;
  cachedCustomUrl = null;
}
