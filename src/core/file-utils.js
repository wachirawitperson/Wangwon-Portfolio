/**
 * General file utilities for Wangwon Portfolio
 */

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extract extension from a filename.
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename = '') {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if a file or filename is a supported image format.
 * @param {File|string} fileOrName
 * @returns {boolean}
 */
export function isSupportedImage(fileOrName) {
  if (!fileOrName) return false;
  if (typeof fileOrName === 'string') {
    const ext = getFileExtension(fileOrName);
    return SUPPORTED_EXTENSIONS.has(ext);
  }
  if (fileOrName instanceof File || fileOrName instanceof Blob) {
    if (SUPPORTED_IMAGE_TYPES.has(fileOrName.type)) return true;
    const ext = getFileExtension(fileOrName.name || '');
    return SUPPORTED_EXTENSIONS.has(ext);
  }
  return false;
}

/**
 * Check if a file is HEIC/HEIF format.
 * @param {File} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  const ext = getFileExtension(file.name || '');
  return type.includes('heic') || type.includes('heif') || ext === 'heic' || ext === 'heif';
}
