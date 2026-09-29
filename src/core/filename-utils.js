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
 * Generates the portfolio PDF filename based on student information.
 * Example: "ด.ช.สมชาย_ใจดี.pdf"
 *
 * @param {object} student - Student state object
 * @returns {string} Sanitized PDF filename
 */
export function generatePdfFilename(student = {}) {
  const prefix = (student.prefix || '').trim();
  const firstName = (student.firstName || '').trim();
  const lastName = (student.lastName || '').trim();

  // When student data is incomplete, return safe fallback
  if (!firstName) {
    return DEFAULT_PDF_FALLBACK_FILENAME;
  }

  let baseName = '';
  if (lastName) {
    baseName = `${prefix}${firstName}_${lastName}`;
  } else {
    baseName = `${prefix}${firstName}`;
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
 * @param {object} student - Student state object
 * @param {number} index - 1-based index
 * @param {string} extension - Image file extension (default: 'jpg')
 * @returns {string} Sanitized image filename
 */
export function generateImageExportFilename(student = {}, index = 1, extension = 'jpg') {
  const pdfName = generatePdfFilename(student).replace(/\.pdf$/i, '');
  const seq = String(index).padStart(2, '0');
  const cleanExt = extension.replace(/^\./, '').toLowerCase() || 'jpg';

  return `${pdfName}_${seq}.${cleanExt}`;
}
