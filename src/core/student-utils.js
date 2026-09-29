/**
 * Student Utilities & Business Logic
 * Pure functions for student display formatting, normalization, and validation.
 */

export const PREFIX_OPTIONS = [
  { value: 'ด.ช.', label: 'เด็กชาย (ด.ช.)' },
  { value: 'ด.ญ.', label: 'เด็กหญิง (ด.ญ.)' },
  { value: 'นาย', label: 'นาย' },
  { value: 'นางสาว', label: 'นางสาว' }
];

export const GRADE_OPTIONS = [
  'อนุบาล 1',
  'อนุบาล 2',
  'อนุบาล 3',
  'ประถมศึกษาปีที่ 1',
  'ประถมศึกษาปีที่ 2',
  'ประถมศึกษาปีที่ 3',
  'ประถมศึกษาปีที่ 4',
  'ประถมศึกษาปีที่ 5',
  'ประถมศึกษาปีที่ 6'
];

/**
 * Returns dynamic default Buddhist Era academic year.
 * Gregorian year + 543.
 * @returns {string} e.g. "2569"
 */
export function getDefaultAcademicYear() {
  const gregorianYear = new Date().getFullYear();
  return String(gregorianYear + 543);
}

/**
 * Normalizes student object data.
 * @param {object} student
 * @returns {object} Normalized student object
 */
export function normalizeStudentData(student = {}) {
  return {
    prefix: typeof student.prefix === 'string' ? student.prefix.trim() : 'ด.ช.',
    firstName: typeof student.firstName === 'string' ? student.firstName.trim() : '',
    lastName: typeof student.lastName === 'string' ? student.lastName.trim() : '',
    grade: typeof student.grade === 'string' ? student.grade.trim() : '',
    studentNumber: typeof student.studentNumber === 'string' ? student.studentNumber.trim() : '',
    academicYear: typeof student.academicYear === 'string' ? student.academicYear.trim() : getDefaultAcademicYear()
  };
}

/**
 * Generates the student's full display name (e.g. "ด.ช.สมชาย ใจดี").
 * @param {object} student
 * @returns {string} Full display name or fallback
 */
export function getStudentDisplayName(student = {}) {
  const prefix = (student.prefix || '').trim();
  const firstName = (student.firstName || '').trim();
  const lastName = (student.lastName || '').trim();

  if (firstName && lastName) {
    return `${prefix}${firstName} ${lastName}`.trim();
  }
  if (firstName) {
    return `${prefix}${firstName}`.trim();
  }
  return 'ชื่อ-นามสกุล นักเรียน';
}

/**
 * Validates student information against required fields and format rules.
 *
 * Rules:
 * - prefix: required
 * - firstName: required (non-empty)
 * - lastName: required (non-empty)
 * - grade: required (must be selected)
 * - academicYear: required (exactly 4 digits)
 * - studentNumber: optional
 *
 * @param {object} student - Student state object
 * @returns {{ valid: boolean, errors: Record<string, string> }} Validation result
 */
export function validateStudentInformation(student = {}) {
  const errors = {};

  const prefix = (student.prefix || '').trim();
  if (!prefix) {
    errors.prefix = 'กรุณาเลือกคำนำหน้า';
  }

  const firstName = (student.firstName || '').trim();
  if (!firstName) {
    errors.firstName = 'กรุณากรอกชื่อ';
  }

  const lastName = (student.lastName || '').trim();
  if (!lastName) {
    errors.lastName = 'กรุณากรอกนามสกุล';
  }

  const grade = (student.grade || '').trim();
  if (!grade) {
    errors.grade = 'กรุณาเลือกระดับชั้น';
  }

  const year = (student.academicYear || '').trim();
  if (!year) {
    errors.academicYear = 'กรุณากรอกปีการศึกษา 4 หลัก';
  } else if (!/^\d{4}$/.test(year)) {
    errors.academicYear = 'กรุณากรอกปีการศึกษาเป็นตัวเลข 4 หลัก';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
