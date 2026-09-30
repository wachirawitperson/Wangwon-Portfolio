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

    // Dedicated Student Profile Photo (Optional, isolated from images)
    studentPhoto: null, // { file, previewUrl, mimeType, width, height }

    // Page 1: Locked Front Cover
    frontCover: {
      mode: 'generated', // 'generated' | 'custom'
      source: 'template', // backwards compatibility alias for 'generated'
      templateId: 'minimal-school', // 'minimal-school' | 'colorful-portfolio' | 'modern-academic'
      customFile: null,
      customPreviewUrl: null,
      isLocked: true
    },

    // Middle Pages: Teacher-imported student images
    images: [],

    // Last Page: Locked Back Cover
    backCover: {
      mode: 'generated', // 'generated' | 'custom'
      source: 'template',
      templateId: 'minimal-school',
      customFile: null,
      customPreviewUrl: null,
      isLocked: true
    },

    // Watermark Configuration
    watermark: {
      enabled: false,
      type: null, // 'school' | 'custom' | null
      file: null,
      previewUrl: null,
      image: null,
      opacity: 0.15,
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
 * Updates or sets the student's profile photo.
 * Automatically revokes any previous studentPhoto.previewUrl.
 * @param {object|null} photoData
 */
export function updateStudentPhoto(photoData) {
  const currentPhoto = projectStore.getState().studentPhoto;
  if (currentPhoto?.previewUrl && currentPhoto.previewUrl !== photoData?.previewUrl) {
    if (typeof currentPhoto.previewUrl === 'string' && currentPhoto.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(currentPhoto.previewUrl);
      } catch (e) {
        // ignore
      }
    }
  }

  projectStore.setState({
    studentPhoto: photoData || null
  });
}

/**
 * Removes the student's profile photo and revokes previewUrl.
 */
export function clearStudentPhoto() {
  updateStudentPhoto(null);
}

/**
 * Updates watermark settings and revokes previous custom watermark URL if replaced.
 * @param {Partial<object>} watermarkData
 */
export function updateWatermark(watermarkData) {
  projectStore.setState((state) => {
    if (
      state.watermark?.previewUrl &&
      watermarkData?.previewUrl &&
      state.watermark.previewUrl !== watermarkData.previewUrl &&
      state.watermark.previewUrl.startsWith('blob:')
    ) {
      try {
        URL.revokeObjectURL(state.watermark.previewUrl);
      } catch (e) {
        // ignore
      }
    }
    return {
      watermark: {
        ...state.watermark,
        ...watermarkData
      }
    };
  });
}

/**
 * Sets the active cover template for both Front and Back covers.
 * @param {string} templateId - 'minimal-school' | 'colorful-portfolio' | 'modern-academic'
 */
export function setCoverTemplate(templateId) {
  projectStore.setState((state) => ({
    frontCover: {
      ...state.frontCover,
      templateId
    },
    backCover: {
      ...state.backCover,
      templateId
    }
  }));
}

/**
 * Sets an uploaded custom cover image for Front or Back cover.
 * Automatically revokes any previous custom preview URL.
 *
 * @param {'front'|'back'} type
 * @param {File} file
 * @param {string} previewUrl
 */
export function setCustomCover(type, file, previewUrl) {
  const key = type === 'front' ? 'frontCover' : 'backCover';
  const currentCover = projectStore.getState()[key];

  if (currentCover?.customPreviewUrl && currentCover.customPreviewUrl !== previewUrl) {
    if (typeof currentCover.customPreviewUrl === 'string' && currentCover.customPreviewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(currentCover.customPreviewUrl);
      } catch (e) {
        // ignore
      }
    }
  }

  projectStore.setState({
    [key]: {
      ...currentCover,
      mode: 'custom',
      source: 'custom',
      customFile: file,
      customPreviewUrl: previewUrl
    }
  });
}

/**
 * Resets a cover from custom back to the generated template.
 * Safely revokes the custom preview URL.
 *
 * @param {'front'|'back'} type
 */
export function resetCoverToGenerated(type) {
  const key = type === 'front' ? 'frontCover' : 'backCover';
  const currentCover = projectStore.getState()[key];

  if (currentCover?.customPreviewUrl) {
    if (typeof currentCover.customPreviewUrl === 'string' && currentCover.customPreviewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(currentCover.customPreviewUrl);
      } catch (e) {
        // ignore
      }
    }
  }

  projectStore.setState({
    [key]: {
      ...currentCover,
      mode: 'generated',
      source: 'template',
      customFile: null,
      customPreviewUrl: null
    }
  });
}

/**
 * Canonical reset function for the entire project state.
 */
export function resetPortfolioProject() {
  const currentState = projectStore.getState();

  // Clean up activity image URLs
  const currentImages = currentState.images || [];
  currentImages.forEach((img) => {
    if (img.previewUrl && typeof img.previewUrl === 'string' && img.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(img.previewUrl);
      } catch (e) {
        // ignore
      }
    }
  });

  // Clean up student photo URL
  if (currentState.studentPhoto?.previewUrl && currentState.studentPhoto.previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentState.studentPhoto.previewUrl);
    } catch (e) {
      // ignore
    }
  }

  // Clean up custom watermark URL
  if (currentState.watermark?.previewUrl && currentState.watermark.previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentState.watermark.previewUrl);
    } catch (e) {
      // ignore
    }
  }

  // Clean up custom front cover URL
  if (currentState.frontCover?.customPreviewUrl && currentState.frontCover.customPreviewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentState.frontCover.customPreviewUrl);
    } catch (e) {
      // ignore
    }
  }

  // Clean up custom back cover URL
  if (currentState.backCover?.customPreviewUrl && currentState.backCover.customPreviewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentState.backCover.customPreviewUrl);
    } catch (e) {
      // ignore
    }
  }

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
