/**
 * Filename utilities for Wangwon Portfolio
 * Handles Thai-safe filename sanitization and naming conventions for PDFs and exported images.
 */

// Unsafe characters in Windows and POSIX filenames: \ / : * ? " < > | and control characters
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f\x7f]/g;

export const DEFAULT_PDF_FALLBACK_FILENAME = 'portfolio-นักเรียน.pdf';

/**
 * Sanitizes a string for use as a valid filename.
 * Preserves Thai characters (Unicode \u0E00-\u0E7F), alphanumeric, underscores, and dashes.
 * Replaces unsafe characters and consecutive spaces with clean underscores.
 *
 * @param {string} rawName - Input name or string
 * @param {string} fallback - Fallback if name is empty
 * @returns {string} Safe filename base
 */
export function sanitizeFilename(rawName, fallback = 'portfolio') {
  if (!rawName || typeof rawName !== 'string') {
    return fallback;
  }

  // Remove unsafe filesystem characters
  let cleaned = rawName.replace(UNSAFE_FILENAME_CHARS, '').trim();

  // Replace spaces and whitespace sequences with single underscore
  cleaned = cleaned.replace(/\s+/g, '_');

  // Collapse consecutive underscores
  cleaned = cleaned.replace(/_+/g, '_');

  // Strip leading or trailing underscores
  cleaned = cleaned.replace(/^_+|_+$/g, '');

  return cleaned || fallback;
}

/**
 * Returns the standardized student base name for file exports.
 * Format: "[prefix][firstName]_[lastName]" (or "[prefix][firstName]" if no lastName).
 * Fallback: "นักเรียน"
 *
 * @param {object} student - Student state object
 * @returns {string} Sanitized base name without extension
 */
export function getStudentExportBaseName(student = {}) {
  const prefix = (student?.prefix || '').trim();
  const firstName = (student?.firstName || '').trim();
  const lastName = (student?.lastName || '').trim();

  if (!firstName) {
    return 'นักเรียน';
  }

  let raw = '';
  if (lastName) {
    raw = `${prefix}${firstName}_${lastName}`;
  } else {
    raw = `${prefix}${firstName}`;
  }

  return sanitizeFilename(raw, 'นักเรียน');
}

/**
 * Generates the portfolio PDF filename based on student information.
 * Example: "ด.ช.สมชาย_ใจดี.pdf"
 *
 * @param {object} student - Student state object
 * @returns {string} Sanitized PDF filename
 */
export function generatePdfFilename(student = {}) {
  const baseName = getStudentExportBaseName(student);
  if (baseName === 'นักเรียน' && !(student?.firstName || '').trim()) {
    return DEFAULT_PDF_FALLBACK_FILENAME;
  }
  const safe = sanitizeFilename(baseName, 'portfolio-นักเรียน');

  // Ensure it doesn't end with double .pdf or missing .pdf
  const withoutExt = safe.replace(/\.pdf$/i, '');
  return `${withoutExt}.pdf`;
}

/**
 * Generates a renamed exported image filename with zero-padded sequence numbering.
 * Example: "ด.ช.สมชาย_ใจดี_01.jpg"
 *
 * @param {object} params
 * @param {object} params.student - Student state object
 * @param {number} params.sequence - 1-based sequence index
 * @param {string} params.extension - Image file extension (e.g. 'jpg', 'png', 'webp')
 * @returns {string} Sanitized image filename
 */
export function getExportImageFilename({ student = {}, sequence = 1, extension = 'jpg' } = {}) {
  const baseName = getStudentExportBaseName(student);
  const seq = String(sequence).padStart(2, '0');
  const cleanExt = (extension || 'jpg').replace(/^\./, '').toLowerCase() || 'jpg';

  return `${baseName}_${seq}.${cleanExt}`;
}

/**
 * Generates the portfolio package ZIP filename based on student information.
 * Example: "ด.ช.สมชาย_ใจดี_Portfolio.zip"
 * Fallback: "Portfolio_นักเรียน.zip"
 *
 * @param {object} student - Student state object
 * @returns {string} Sanitized ZIP filename
 */
export function getExportPackageFilename(student = {}) {
  const firstName = (student?.firstName || '').trim();
  if (!firstName) {
    return 'Portfolio_นักเรียน.zip';
  }

  const baseName = getStudentExportBaseName(student);
  const safe = sanitizeFilename(baseName, 'Portfolio_นักเรียน');
  return `${safe}_Portfolio.zip`;
}


