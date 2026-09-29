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
  * Reads the natural width and height of an image File or Blob.
  * @param {Blob|File} blob
  * @returns {Promise<{ width: number, height: number, aspectRatio: number }>}
  */
export function getImageDimensions(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      return reject(new Error('No blob provided'));
    }
    const tempUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(tempUrl);
      if (!width || !height) {
        reject(new Error('Invalid image dimensions'));
      } else {
        resolve({
          width,
          height,
          aspectRatio: parseFloat((width / height).toFixed(4))
        });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      reject(new Error('Image failed to load (corrupted or unreadable format)'));
    };
    img.src = tempUrl;
  });
}

/**
  * Assesses whether an image is considered low resolution for print.
  * Criterion: longest edge < 1200px or (width < 1000 and height < 1000)
  * @param {number} width
  * @param {number} height
  * @returns {{ status: 'normal' | 'low', warning: string | null }}
  */
export function assessImageQuality(width, height) {
  if (!width || !height) {
    return { status: 'normal', warning: null };
  }
  const longestEdge = Math.max(width, height);
  if (longestEdge < 1200 || (width < 1000 && height < 1000)) {
    return {
      status: 'low',
      warning: `ความละเอียดค่อนข้างต่ำ (${width} × ${height} px) อาจไม่คมชัดเมื่อพิมพ์ A4`
    };
  }
  return { status: 'normal', warning: null };
}

/**
  * Builds a robust duplicate detection key from file properties.
  * Fingerprint: name + size + lastModified (or fallback dimensions)
  * @param {File|Blob} file
  * @param {object} [metadata]
  * @returns {string}
  */
export function buildDuplicateKey(file, metadata = {}) {
  const name = (file && file.name) ? file.name.trim().toLowerCase() : '';
  const size = (file && typeof file.size === 'number') ? file.size : 0;
  const lastModified = (file && typeof file.lastModified === 'number') ? file.lastModified : 0;
  const w = metadata.width || 0;
  const h = metadata.height || 0;

  if (name && size) {
    return `${name}_${size}_${lastModified || `${w}x${h}`}`;
  }
  return `blob_${size}_${w}x${h}`;
}

/**
  * Decodes HEIC/HEIF file to standard JPEG/PNG Blob if needed.
  * Handles browser environment with window.heic2any or graceful fallback.
  * @param {File} file
  * @returns {Promise<{ blob: Blob|File, converted: boolean, filename: string, mimeType: string }>}
  */
export async function decodeHeicIfNeeded(file) {
  const isHeic = (file.type && (file.type.includes('heic') || file.type.includes('heif'))) ||
                 (file.name && /\.(heic|heif)$/i.test(file.name));

  if (!isHeic) {
    return {
      blob: file,
      converted: false,
      filename: file.name || 'image.jpg',
      mimeType: file.type || 'image/jpeg'
    };
  }

  // Check if heic2any is available in window
  if (typeof window !== 'undefined' && typeof window.heic2any === 'function') {
    try {
      const conversionResult = await window.heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92
      });
      const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
      const originalName = file.name || 'image.heic';
      const newFilename = originalName.replace(/\.(heic|heif)$/i, '.jpg');

      return {
        blob: convertedBlob,
        converted: true,
        filename: newFilename,
        mimeType: 'image/jpeg'
      };
    } catch (err) {
      throw new Error(`HEIC decoding failed: ${err.message || 'unknown error'}`);
    }
  }

  // If heic2any is not globally available, check if browser natively supports decoding HEIC
  try {
    const dims = await getImageDimensions(file);
    if (dims.width > 0) {
      return {
        blob: file,
        converted: false,
        filename: file.name,
        mimeType: file.type || 'image/heic'
      };
    }
  } catch (e) {
    // Native decode failed and no converter available
    throw new Error('เบราว์เซอร์ไม่รองรับไฟล์ HEIC และไม่มีโมดูลแปลงไฟล์');
  }

  return {
    blob: file,
    converted: false,
    filename: file.name,
    mimeType: file.type || 'image/heic'
  };
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
