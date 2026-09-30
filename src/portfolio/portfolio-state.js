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

    // Watermark Configuration (Phase 8)
    watermark: {
      enabled: false,
      sourceType: 'none', // 'none' | 'school-logo' | 'custom'
      custom: {
        file: null,
        previewUrl: null,
        mimeType: null,
        width: null,
        height: null
      },
      opacity: 0.18,            // 18% default (0.05–0.80 range)
      scale: 0.18,              // 18% of page width (0.08–0.40 range)
      position: 'bottom-right', // 9-position grid
      applyTo: 'activity-only'  // 'all-pages' | 'activity-only' | 'exclude-covers'
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
 * Enables watermark and optionally auto-selects school-logo source.
 * @param {boolean} enabled
 */
export function setWatermarkEnabled(enabled) {
  projectStore.setState((state) => {
    const wm = { ...state.watermark, enabled };
    // On first enable with no source selected, auto-select school-logo
    if (enabled && state.watermark.sourceType === 'none') {
      wm.sourceType = 'school-logo';
    }
    // When disabling, set sourceType to 'none'
    if (!enabled) {
      wm.sourceType = 'none';
    }
    return { watermark: wm };
  });
}

/**
 * Sets the watermark source type (school-logo or custom).
 * Does not affect custom image data.
 * @param {'none'|'school-logo'|'custom'} sourceType
 */
export function setWatermarkSourceType(sourceType) {
  projectStore.setState((state) => ({
    watermark: { ...state.watermark, sourceType }
  }));
}

/**
 * Sets a custom watermark image. Revokes any previous custom preview URL.
 * @param {File} file
 * @param {string} previewUrl - blob: URL
 * @param {string} mimeType
 * @param {number} width
 * @param {number} height
 */
export function setCustomWatermark(file, previewUrl, mimeType, width, height) {
  projectStore.setState((state) => {
    // Revoke previous custom URL if exists
    const prevUrl = state.watermark?.custom?.previewUrl;
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(prevUrl); } catch (e) { /* ignore */ }
    }
    return {
      watermark: {
        ...state.watermark,
        sourceType: 'custom',
        custom: { file, previewUrl, mimeType, width, height }
      }
    };
  });
}

/**
 * Replaces the current custom watermark with a new one.
 * Alias for setCustomWatermark — revokes old URL automatically.
 */
export function replaceCustomWatermark(file, previewUrl, mimeType, width, height) {
  setCustomWatermark(file, previewUrl, mimeType, width, height);
}

/**
 * Removes the custom watermark image and falls back:
 * - If watermark is still enabled → fall back to 'school-logo'
 * - If watermark is disabled → sourceType = 'none'
 */
export function removeCustomWatermark() {
  projectStore.setState((state) => {
    const prevUrl = state.watermark?.custom?.previewUrl;
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(prevUrl); } catch (e) { /* ignore */ }
    }
    const fallbackSource = state.watermark.enabled ? 'school-logo' : 'none';
    return {
      watermark: {
        ...state.watermark,
        sourceType: fallbackSource,
        custom: { file: null, previewUrl: null, mimeType: null, width: null, height: null }
      }
    };
  });
}

/**
 * Updates watermark presentation settings (opacity, scale, position, applyTo).
 * Never revokes custom watermark URLs.
 * @param {object} settings - Partial: { opacity?, scale?, position?, applyTo? }
 */
export function updateWatermarkSettings(settings) {
  const allowed = ['opacity', 'scale', 'position', 'applyTo'];
  const filtered = {};
  for (const key of allowed) {
    if (settings[key] !== undefined) {
      filtered[key] = settings[key];
    }
  }
  projectStore.setState((state) => ({
    watermark: { ...state.watermark, ...filtered }
  }));
}

/**
 * Legacy-compatible convenience: Updates watermark state with a partial object.
 * Used by existing code. Delegates to specific functions where possible.
 * @param {Partial<object>} watermarkData
 * @deprecated Prefer explicit lifecycle functions (setWatermarkEnabled, setCustomWatermark, etc.)
 */
export function updateWatermark(watermarkData) {
  projectStore.setState((state) => ({
    watermark: {
      ...state.watermark,
      ...watermarkData
    }
  }));
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
  if (currentState.watermark?.custom?.previewUrl && currentState.watermark.custom.previewUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(currentState.watermark.custom.previewUrl);
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
