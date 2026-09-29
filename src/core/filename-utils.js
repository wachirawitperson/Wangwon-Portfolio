/**
 * Filename utilities for Wangwon Portfolio
 * Handles Thai-safe filename sanitization and naming conventions for PDFs and exported images.
 */

// Unsafe characters in Windows and POSIX filenames: \ / : * ? " < > | and control characters
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f\x7f]/g;

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

  const cleaned = rawName
    .replace(UNSAFE_FILENAME_CHARS, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

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
  const prefix = student.prefix ? student.prefix.trim() : '';
  const firstName = student.firstName ? student.firstName.trim() : '';
  const lastName = student.lastName ? student.lastName.trim() : '';

  let baseName = '';
  if (firstName && lastName) {
    baseName = `${prefix}${firstName}_${lastName}`;
  } else if (firstName) {
    baseName = `${prefix}${firstName}`;
  } else {
    baseName = 'แฟ้มสะสมงาน_นักเรียน';
  }

  const safe = sanitizeFilename(baseName, 'portfolio');
  return safe.endsWith('.pdf') ? safe : `${safe}.pdf`;
}

/**
 * Generates a renamed exported image filename with zero-padded sequence numbering.
 * Example: "ด.ช.สมชาย_ใจดี_01.jpg"
 *
 * @param {object} student - Student state object
 * @param {number} index - 1-based or 0-based index
 * @param {string} extension - Image file extension (default: 'jpg')
 * @returns {string} Sanitized image filename
 */
export function generateImageExportFilename(student = {}, index = 1, extension = 'jpg') {
  const pdfName = generatePdfFilename(student).replace(/\.pdf$/i, '');
  const seq = String(index).padStart(2, '0');
  const cleanExt = extension.replace(/^\./, '').toLowerCase() || 'jpg';

  return `${pdfName}_${seq}.${cleanExt}`;
}
