/**
 * Cover Page Manager
 * Enforces rules for Page 1 (Front Cover) and Last Page (Back Cover).
 * Covers are special locked items that cannot be deleted or reordered,
 * but can be customized or restored to defaults.
 */

export const COVER_TEMPLATES = [
  {
    id: 'minimal-school',
    name: 'โรงเรียนมาตรฐาน (Minimal School)',
    description: 'เรียบง่าย สะอาดตา เหมาะสำหรับรายงานผลการเรียนและกิจกรรมทั่วไป',
    accentColor: '#1e3a8a'
  },
  {
    id: 'colorful-portfolio',
    name: 'สีสันสดใส (Colorful Portfolio)',
    description: 'เน้นความสดใส เหมาะสำหรับนักเรียนระดับปฐมวัยและประถมต้น',
    accentColor: '#059669'
  },
  {
    id: 'modern-academic',
    name: 'วิชาการสมัยใหม่ (Modern Academic)',
    description: 'เป็นทางการ สวยงาม เหมาะสำหรับการแข่งขันและแฟ้มประเมินคุณภาพ',
    accentColor: '#4f46e5'
  }
];

/**
 * Gets template definition by template ID.
 * @param {string} templateId
 * @returns {object}
 */
export function getCoverTemplate(templateId = 'minimal-school') {
  return (
    COVER_TEMPLATES.find((tpl) => tpl.id === templateId) || COVER_TEMPLATES[0]
  );
}

/**
 * Validates that an item is a locked cover and enforces immutability for reordering.
 * @param {'front'|'back'} type
 * @returns {boolean}
 */
export function isLockedCover(type) {
  return type === 'front' || type === 'back';
}

/**
 * Architecture hook: Prepares cover rendering parameters combining template and student data.
 * (Will be executed locally in Phase 3/4 via Canvas / SVG / pdf-lib without external APIs).
 *
 * @param {object} coverConfig - frontCover or backCover state
 * @param {object} student - Student state
 * @returns {object} Render specs
 */
export function prepareCoverRenderSpecs(coverConfig, student) {
  const template = getCoverTemplate(coverConfig?.templateId);
  return {
    isCustom: coverConfig?.source === 'custom',
    customImage: coverConfig?.customImage,
    template,
    studentFields: {
      fullName: `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim(),
      grade: student.grade || '',
      studentNumber: student.studentNumber || '',
      academicYear: student.academicYear || '',
      schoolName: 'โรงเรียนบ้านวังวน'
    }
  };
}
