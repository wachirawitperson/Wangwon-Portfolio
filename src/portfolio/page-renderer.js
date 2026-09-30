/**
 * Page Renderer Module (Phase 9)
 *
 * Responsible for rendering individual A4 portfolio pages onto offscreen HTML5 Canvas
 * at exact DPI-based pixel resolutions, matching orientation, placement mode (Fit vs Fill),
 * rotation (0°, 90°, 180°, 270°), and watermark overlay settings.
 *
 * 100% Client-side. Zero external network requests.
 */
import { generateCoverCanvas } from './cover-generator.js';
import {
  shouldApplyWatermark,
  calculateWatermarkLayout,
  renderWatermarkOnCanvas
} from './watermark-renderer.js';

/**
 * Standard A4 dimensions in PDF typographical points (72 points per inch).
 */
export const PDF_PAGE_POINTS = {
  portrait: { width: 595.28, height: 841.89 },
  landscape: { width: 841.89, height: 595.28 }
};

/**
 * Quality configuration mapping for PDF generation.
 * Small: ~150 DPI, 0.75 JPEG quality (smaller file, fast export)
 * Balanced: ~200 DPI, 0.85 JPEG quality (recommended compromise)
 * High: ~300 DPI, 0.93 JPEG quality (print-shop ready)
 */
export const PDF_QUALITY_CONFIG = {
  small: {
    dpi: 150,
    jpegQuality: 0.75,
    portraitWidth: 1240,
    portraitHeight: 1754,
    landscapeWidth: 1754,
    landscapeHeight: 1240
  },
  balanced: {
    dpi: 200,
    jpegQuality: 0.85,
    portraitWidth: 1654,
    portraitHeight: 2339,
    landscapeWidth: 2339,
    landscapeHeight: 1654
  },
  high: {
    dpi: 300,
    jpegQuality: 0.93,
    portraitWidth: 2480,
    portraitHeight: 3508,
    landscapeWidth: 3508,
    landscapeHeight: 2480
  }
};

/**
 * Calculates page pixel dimensions for a given orientation and quality setting.
 *
 * @param {object} params
 * @param {'portrait'|'landscape'} [params.orientation='portrait']
 * @param {'small'|'balanced'|'high'} [params.quality='balanced']
 * @returns {{ width: number, height: number, dpi: number, jpegQuality: number }}
 */
export function getPagePixelDimensions({ orientation = 'portrait', quality = 'balanced' } = {}) {
  const config = PDF_QUALITY_CONFIG[quality] || PDF_QUALITY_CONFIG.balanced;
  const isLandscape = orientation === 'landscape';

  return {
    width: isLandscape ? config.landscapeWidth : config.portraitWidth,
    height: isLandscape ? config.landscapeHeight : config.portraitHeight,
    dpi: config.dpi,
    jpegQuality: config.jpegQuality
  };
}

/**
 * Computes draw coordinates and dimensions for placing an image onto an A4 page canvas.
 * Correctly accounts for image rotation (effective aspect ratio swaps when rotated 90° or 270°).
 *
 * @param {object} params
 * @param {number} params.sourceWidth - Natural image width
 * @param {number} params.sourceHeight - Natural image height
 * @param {number} params.pageWidth - Target canvas width
 * @param {number} params.pageHeight - Target canvas height
 * @param {'fit'|'fill'} [params.mode='fit'] - Placement mode
 * @param {number} [params.rotation=0] - Rotation angle in degrees (0, 90, 180, 270)
 * @returns {{
 *   drawWidth: number,
 *   drawHeight: number,
 *   centerX: number,
 *   centerY: number,
 *   effectiveWidth: number,
 *   effectiveHeight: number,
 *   scale: number
 * }}
 */
export function calculateImagePlacement({
  sourceWidth,
  sourceHeight,
  pageWidth,
  pageHeight,
  mode = 'fit',
  rotation = 0
}) {
  if (!sourceWidth || !sourceHeight || !pageWidth || !pageHeight) {
    return {
      drawWidth: 0,
      drawHeight: 0,
      centerX: pageWidth / 2 || 0,
      centerY: pageHeight / 2 || 0,
      effectiveWidth: 0,
      effectiveHeight: 0,
      scale: 1
    };
  }

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isSwapped = normalizedRotation === 90 || normalizedRotation === 270;

  // When rotated 90° or 270°, the bounding box in page coordinates swaps width and height
  const effSourceWidth = isSwapped ? sourceHeight : sourceWidth;
  const effSourceHeight = isSwapped ? sourceWidth : sourceHeight;

  let scale;
  if (mode === 'fill') {
    // Fill mode: scale so that the entire page area is covered (overflow cropped)
    scale = Math.max(pageWidth / effSourceWidth, pageHeight / effSourceHeight);
  } else {
    // Fit mode (default): scale so that entire image is visible (letterboxed/pillarboxed)
    scale = Math.min(pageWidth / effSourceWidth, pageHeight / effSourceHeight);
  }

  // Draw dimensions in the image's unrotated local coordinate system
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  return {
    drawWidth,
    drawHeight,
    centerX: pageWidth / 2,
    centerY: pageHeight / 2,
    effectiveWidth: effSourceWidth * scale,
    effectiveHeight: effSourceHeight * scale,
    scale
  };
}

/**
 * Loads an HTMLImageElement from a URL or blob URL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      return reject(new Error('Image source URL is empty'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from: ${src}`));
    img.src = src;
  });
}

/**
 * Renders an activity page onto an HTML5 Canvas.
 * Draws white background, student image with rotation and fit/fill, and optional watermark.
 *
 * @param {object} params
 * @param {object} params.imageItem - Image item from state.images ({ previewUrl, rotation, ... })
 * @param {number} params.pageWidth - Target page width in px
 * @param {number} params.pageHeight - Target page height in px
 * @param {'fit'|'fill'} [params.placement='fit'] - Fit or fill mode
 * @param {object|null} [params.watermarkState] - Watermark state from store
 * @param {HTMLImageElement|null} [params.watermarkImage] - Preloaded watermark image
 * @returns {Promise<HTMLCanvasElement>} Rendered canvas
 */
export async function renderActivityPageCanvas({
  imageItem,
  pageWidth,
  pageHeight,
  placement = 'fit',
  watermarkState = null,
  watermarkImage = null
}) {
  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d');

  // Fill crisp white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  if (imageItem && imageItem.previewUrl) {
    const img = await loadImageElement(imageItem.previewUrl);
    const rotation = imageItem.rotation || 0;
    const placementCalc = calculateImagePlacement({
      sourceWidth: img.naturalWidth || img.width,
      sourceHeight: img.naturalHeight || img.height,
      pageWidth,
      pageHeight,
      mode: placement,
      rotation
    });

    // Draw rotated image centered on page
    ctx.save();
    // Clip to page boundary if in fill mode to avoid bleeding
    if (placement === 'fill') {
      ctx.beginPath();
      ctx.rect(0, 0, pageWidth, pageHeight);
      ctx.clip();
    }

    ctx.translate(placementCalc.centerX, placementCalc.centerY);
    if (rotation !== 0) {
      const angleRad = (rotation * Math.PI) / 180;
      ctx.rotate(angleRad);
    }

    // High-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      -placementCalc.drawWidth / 2,
      -placementCalc.drawHeight / 2,
      placementCalc.drawWidth,
      placementCalc.drawHeight
    );
    ctx.restore();
  }

  // Apply watermark if enabled and targets activity pages
  if (
    watermarkState &&
    watermarkState.enabled &&
    watermarkState.sourceType !== 'none' &&
    watermarkImage &&
    shouldApplyWatermark(watermarkState.applyTo, 'activity')
  ) {
    const wmNatW = watermarkImage.naturalWidth || watermarkImage.width;
    const wmNatH = watermarkImage.naturalHeight || watermarkImage.height;

    const layout = calculateWatermarkLayout({
      pageWidth,
      pageHeight,
      watermarkNaturalWidth: wmNatW,
      watermarkNaturalHeight: wmNatH,
      scale: watermarkState.scale || 0.18,
      position: watermarkState.position || 'bottom-right'
    });

    renderWatermarkOnCanvas(ctx, watermarkImage, layout, watermarkState.opacity || 0.18);
  }

  return canvas;
}

/**
 * Renders a Front or Back cover page onto an HTML5 Canvas.
 * Handles both template-generated covers (via cover-generator.js with high DPI scaling)
 * and custom uploaded cover images (placed with fit/fill onto the page).
 * Stamping watermark if configured for cover pages.
 *
 * @param {object} params
 * @param {'front'|'back'} params.type - Cover type
 * @param {object} params.coverState - Cover state from store (frontCover or backCover)
 * @param {object} params.student - Student info object
 * @param {object|null} params.studentPhoto - Student photo state
 * @param {'portrait'|'landscape'} params.orientation - Page orientation
 * @param {number} params.pageWidth - Target page width in px
 * @param {number} params.pageHeight - Target page height in px
 * @param {object|null} [params.watermarkState] - Watermark state from store
 * @param {HTMLImageElement|null} [params.watermarkImage] - Preloaded watermark image
 * @returns {Promise<HTMLCanvasElement>} Rendered canvas
 */
export async function renderCoverPageCanvas({
  type,
  coverState,
  student,
  studentPhoto,
  orientation,
  pageWidth,
  pageHeight,
  watermarkState = null,
  watermarkImage = null
}) {
  let canvas;

  if (coverState && coverState.mode === 'custom' && coverState.customPreviewUrl) {
    // Custom uploaded cover image: draw centered onto canvas
    canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    const img = await loadImageElement(coverState.customPreviewUrl);
    const placementCalc = calculateImagePlacement({
      sourceWidth: img.naturalWidth || img.width,
      sourceHeight: img.naturalHeight || img.height,
      pageWidth,
      pageHeight,
      mode: 'fit', // preserve entire uploaded custom cover without cropping
      rotation: 0
    });

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      placementCalc.centerX - placementCalc.drawWidth / 2,
      placementCalc.centerY - placementCalc.drawHeight / 2,
      placementCalc.drawWidth,
      placementCalc.drawHeight
    );
    ctx.restore();
  } else {
    // Generated cover template from cover-generator.js scaled to exact DPI
    canvas = await generateCoverCanvas({
      type,
      templateId: coverState?.templateId || 'minimal-school',
      student,
      studentPhoto,
      orientation,
      width: pageWidth,
      height: pageHeight
    });
  }

  // Stamp watermark if enabled and page type is permitted
  const pageType = type === 'front' ? 'front-cover' : 'back-cover';
  if (
    watermarkState &&
    watermarkState.enabled &&
    watermarkState.sourceType !== 'none' &&
    watermarkImage &&
    shouldApplyWatermark(watermarkState.applyTo, pageType)
  ) {
    const ctx = canvas.getContext('2d');
    const wmNatW = watermarkImage.naturalWidth || watermarkImage.width;
    const wmNatH = watermarkImage.naturalHeight || watermarkImage.height;

    const layout = calculateWatermarkLayout({
      pageWidth,
      pageHeight,
      watermarkNaturalWidth: wmNatW,
      watermarkNaturalHeight: wmNatH,
      scale: watermarkState.scale || 0.18,
      position: watermarkState.position || 'bottom-right'
    });

    renderWatermarkOnCanvas(ctx, watermarkImage, layout, watermarkState.opacity || 0.18);
  }

  return canvas;
}