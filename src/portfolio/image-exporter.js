/**
 * Wangwon Portfolio - Phase 10: Filename + Renamed Image Export Engine
 *
 * Implements a clean, reusable image export pipeline that:
 * - Generates standardized Thai filenames: [studentBaseName]_[sequence].[ext]
 * - Reflects user-applied rotation (0°, 90°, 180°, 270°)
 * - Fast-paths unrotated images without re-encoding quality loss
 * - Converts BMP and HEIC/HEIF images to standard JPEG
 * - Preserves transparency for PNG images
 * - Ensures complete immutability of source File and state objects
 * - Keeps image export completely independent of PDF page borders, Fit/Fill cropping, and watermarks
 * - Returns structured export records: { imageId, sequence, filename, blob, mimeType, width, height }
 *
 * Local-first: 100% in-browser, zero server uploads, zero network dependencies.
 */
import { getStudentExportBaseName, getExportImageFilename } from '../core/filename-utils.js';
import { normalizeRotation, getImageDimensions, decodeHeicIfNeeded } from '../core/image-utils.js';

export { getStudentExportBaseName, getExportImageFilename };

/**
 * Resolves the export file extension and MIME type for an activity image.
 *
 * Standard mappings:
 * - image/jpeg, .jpg, .jpeg -> { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: false }
 * - image/png, .png         -> { extension: 'png', mimeType: 'image/png', isConvertibleFormat: false }
 * - image/webp, .webp       -> { extension: 'webp', mimeType: 'image/webp', isConvertibleFormat: false }
 * - image/bmp, .bmp         -> { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: true }
 * - image/heic, .heic, .heif -> { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: true }
 * - fallback                -> { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: false }
 *
 * @param {object} imageItem - Activity image item
 * @returns {{ extension: string, mimeType: string, isConvertibleFormat: boolean }}
 */
export function resolveExportExtensionAndMime(imageItem = {}) {
  const file = imageItem?.file;
  const rawType = (imageItem?.mimeType || file?.type || '').toLowerCase();
  const rawName = (imageItem?.name || file?.name || '').toLowerCase();

  // HEIC / HEIF
  if (rawType.includes('heic') || rawType.includes('heif') || /\.(heic|heif)$/i.test(rawName)) {
    return { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: true };
  }

  // BMP
  if (rawType.includes('bmp') || rawType.includes('x-ms-bmp') || /\.bmp$/i.test(rawName)) {
    return { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: true };
  }

  // PNG
  if (rawType === 'image/png' || /\.png$/i.test(rawName)) {
    return { extension: 'png', mimeType: 'image/png', isConvertibleFormat: false };
  }

  // WebP
  if (rawType === 'image/webp' || /\.webp$/i.test(rawName)) {
    return { extension: 'webp', mimeType: 'image/webp', isConvertibleFormat: false };
  }

  // JPEG / Default
  return { extension: 'jpg', mimeType: 'image/jpeg', isConvertibleFormat: false };
}

/**
 * Loads a Blob or File into an HTMLImageElement.
 *
 * @param {Blob|File} blob
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageElement(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      return reject(new Error('No blob provided for image loading'));
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image element'));
    };
    img.src = url;
  });
}

/**
 * Renders an image to an offscreen Canvas with rotation applied,
 * and encodes it to a new Blob.
 *
 * @param {HTMLImageElement} img
 * @param {number} rotation - 0, 90, 180, 270
 * @param {string} mimeType - Target MIME type ('image/jpeg', 'image/png', 'image/webp')
 * @param {number} quality - Compression quality (default: 0.92)
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
async function renderRotatedImageCanvas(img, rotation, mimeType, quality = 0.92) {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const normRot = normalizeRotation(rotation);

  const isSwapped = normRot === 90 || normRot === 270;
  const targetW = isSwapped ? origH : origW;
  const targetH = isSwapped ? origW : origH;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { alpha: mimeType === 'image/png' });

  // For non-PNG formats (like JPEG), ensure a clean white background if alpha existed
  if (mimeType !== 'image/png') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((normRot * Math.PI) / 180);
  ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
  ctx.restore();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error('Failed to encode rotated image canvas to Blob'));
        } else {
          resolve(b);
        }
      },
      mimeType,
      mimeType === 'image/jpeg' ? quality : undefined
    );
  });

  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    width: targetW,
    height: targetH
  };
}

/**
 * Prepares a single activity image item for export.
 *
 * @param {object} imageItem - An element from projectStore.images
 * @param {object} options
 * @param {object} options.student - Student info object
 * @param {number} options.sequence - 1-based sequential number
 * @returns {Promise<{
 *   imageId: string,
 *   sequence: number,
 *   filename: string,
 *   blob: Blob,
 *   mimeType: string,
 *   width: number,
 *   height: number
 * }>}
 */
export async function exportSingleActivityImage(imageItem, { student = {}, sequence = 1 } = {}) {
  if (!imageItem) {
    throw new Error('No activity image provided for export');
  }

  const rawRotation = imageItem.rotation || 0;
  const rotation = normalizeRotation(rawRotation);
  const targetSpec = resolveExportExtensionAndMime(imageItem);
  const filename = getExportImageFilename({
    student,
    sequence,
    extension: targetSpec.extension
  });

  let sourceBlob = imageItem.file || imageItem.originalFile;

  // If missing file but has decoded image / preview, check for source
  if (!sourceBlob && imageItem.blob) {
    sourceBlob = imageItem.blob;
  }

  if (!sourceBlob) {
    throw new Error(`ไม่สามารถเตรียมรูปที่ ${sequence} (${filename}) สำหรับส่งออกได้: ไม่พบข้อมูลไฟล์รูปภาพ`);
  }

  // Handle HEIC if necessary
  if (targetSpec.isConvertibleFormat && (sourceBlob.type?.includes('heic') || /\.(heic|heif)$/i.test(sourceBlob.name || ''))) {
    try {
      const decoded = await decodeHeicIfNeeded(sourceBlob);
      sourceBlob = decoded.blob;
    } catch (err) {
      throw new Error(`ไม่สามารถเตรียมรูปที่ ${sequence} (${filename}) สำหรับส่งออกได้: เกิดข้อผิดพลาดในการแปลงไฟล์ HEIC`);
    }
  }

  try {
    // FAST PATH:
    // If rotation is 0° and format does not require normalization (not BMP / unconverted format),
    // reuse the original source file/blob bytes directly to eliminate re-encoding loss.
    const isBmp = sourceBlob.type?.includes('bmp') || /\.bmp$/i.test(sourceBlob.name || '');
    if (rotation === 0 && !isBmp && !targetSpec.isConvertibleFormat) {
      let width = imageItem.width;
      let height = imageItem.height;

      if (!width || !height) {
        const dims = await getImageDimensions(sourceBlob);
        width = dims.width;
        height = dims.height;
      }

      return {
        imageId: imageItem.id,
        sequence,
        filename,
        blob: sourceBlob,
        mimeType: targetSpec.mimeType,
        width,
        height
      };
    }

    // TRANSFORM PATH:
    // Rotation is non-zero (90°, 180°, 270°) OR format conversion required (BMP, HEIC)
    const imgElement = await loadImageElement(sourceBlob);
    const renderResult = await renderRotatedImageCanvas(
      imgElement,
      rotation,
      targetSpec.mimeType,
      0.92
    );

    return {
      imageId: imageItem.id,
      sequence,
      filename,
      blob: renderResult.blob,
      mimeType: targetSpec.mimeType,
      width: renderResult.width,
      height: renderResult.height
    };
  } catch (err) {
    if (err.message && err.message.startsWith('ไม่สามารถเตรียมรูป')) {
      throw err;
    }
    throw new Error(`ไม่สามารถเตรียมรูปที่ ${sequence} (${filename}) สำหรับส่งออกได้: ${err.message || 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
  }
}

/**
 * Prepares all student activity images from projectState for export.
 *
 * Guarantees:
 * - Order matches projectState.images strictly.
 * - Sequence numbering is 1-based, zero-padded in filenames (01, 02.. 10..).
 * - Excludes student profile photo and covers (front/back).
 * - Returns [] if projectState.images is empty without throwing.
 * - Invokes onProgress callback with { current, total, percentage, filename }.
 *
 * @param {object} projectState - Complete project state (e.g. projectStore.getState())
 * @param {object} [options]
 * @param {function} [options.onProgress] - Progress callback: ({ current, total, percentage, filename }) => void
 * @returns {Promise<Array<{
 *   imageId: string,
 *   sequence: number,
 *   filename: string,
 *   blob: Blob,
 *   mimeType: string,
 *   width: number,
 *   height: number
 * }>>}
 */
export async function prepareAllActivityImageExports(projectState = {}, { onProgress } = {}) {
  const images = Array.isArray(projectState?.images) ? projectState.images : [];
  const student = projectState?.student || {};

  if (images.length === 0) {
    return [];
  }

  const total = images.length;
  const exportedItems = [];

  for (let i = 0; i < total; i++) {
    const sequence = i + 1;
    const imageItem = images[i];

    if (typeof onProgress === 'function') {
      const preliminaryName = getExportImageFilename({
        student,
        sequence,
        extension: resolveExportExtensionAndMime(imageItem).extension
      });
      onProgress({
        current: sequence,
        total,
        percentage: Math.round(((sequence - 0.5) / total) * 100),
        filename: preliminaryName
      });
    }

    const exported = await exportSingleActivityImage(imageItem, {
      student,
      sequence
    });

    exportedItems.push(exported);

    if (typeof onProgress === 'function') {
      onProgress({
        current: sequence,
        total,
        percentage: Math.round((sequence / total) * 100),
        filename: exported.filename
      });
    }
  }

  return exportedItems;
}

/**
 * Helper to trigger a single image download (used for QA / debugging).
 *
 * @param {object} exportItem - Record returned by exportSingleActivityImage
 */
export function downloadExportedImage(exportItem) {
  if (!exportItem?.blob || !exportItem?.filename) {
    throw new Error('Invalid export item: missing blob or filename');
  }

  const url = URL.createObjectURL(exportItem.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportItem.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
