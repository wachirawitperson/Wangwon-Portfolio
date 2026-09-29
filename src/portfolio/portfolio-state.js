/**
 * Portfolio Project State Model & Store
 * Single Source of Truth for the entire application.
 */
import { createStore } from '../core/state.js';
import { generatePdfFilename } from '../core/filename-utils.js';
import { getDefaultAcademicYear } from '../core/student-utils.js';

/**
 * Creates a default, blank PortfolioProject state structure.
 */
export function createDefaultProjectState() {
  const initialStudent = {
    prefix: 'ด.ช.',
    firstName: '',
    lastName: '',
    grade: '',
    studentNumber: '',
    academicYear: getDefaultAcademicYear()
  };

  return {
    student: initialStudent,

    // Page 1: Locked Front Cover
    frontCover: {
      source: 'template', // 'template' | 'custom'
      templateId: 'minimal-school', // 'minimal-school' | 'colorful-portfolio' | 'modern-academic'
      customImage: null,
      isLocked: true
    },

    // Middle Pages: Teacher-imported student images
    images: [],

    // Last Page: Locked Back Cover
    backCover: {
      source: 'template', // 'template' | 'custom'
      templateId: 'minimal-school',
      customImage: null,
      isLocked: true
    },

    // Watermark Configuration
    watermark: {
      enabled: false,
      image: null,
      opacity: 0.25,
      size: 30, // percent of page width
      position: 'center', // 'top-left'|'top-center'|'top-right'|'middle-left'|'center'|'middle-right'|'bottom-left'|'bottom-center'|'bottom-right'
      target: 'student-images' // 'all' | 'student-images' | 'exclude-covers'
    },

    // PDF Configuration
    pdfSettings: {
      paperSize: 'A4',
      orientation: 'portrait', // 'portrait' | 'landscape'
      placement: 'fit', // 'fit' | 'fill'
      margin: 'none', // 'none' | 'normal'
      quality: 'balanced' // 'small' | 'balanced' | 'high'
    },

    // Output target info
    output: {
      filename: generatePdfFilename(initialStudent)
    }
  };
}

// Global project store instance
export const projectStore = createStore(createDefaultProjectState());

/**
 * Controlled update API for a single student field.
 * @param {string} field
 * @param {string} value
 */
export function updateStudentField(field, value) {
  projectStore.setState((state) => ({
    student: {
      ...state.student,
      [field]: value
    }
  }));
}

/**
 * Controlled update API for multiple student fields.
 * @param {object} partial
 */
export function updateStudent(partial = {}) {
  projectStore.setState((state) => ({
    student: {
      ...state.student,
      ...partial
    }
  }));
}

/**
 * Canonical reset function for the entire project state.
 */
export function resetPortfolioProject() {
  projectStore.reset(createDefaultProjectState());
}

// Canonical subscription: Auto-update output filename whenever student info changes
projectStore.subscribe((state) => {
  const currentFilename = state.output?.filename;
  const newFilename = generatePdfFilename(state.student);
  if (currentFilename !== newFilename) {
    projectStore.setState({
      output: {
        ...state.output,
        filename: newFilename
      }
    });
  }
});
