/**
 * Storage adapter and draft serialization architecture
 * Prepares the application for IndexedDB persistence without coupling to DOM state.
 */

const STORAGE_KEY = 'wangwon_portfolio_draft_v1';

/**
 * Serializes portfolio project state into a persistable format.
 * Omits non-serializable objects (e.g. raw File handles or active blob URLs).
 *
 * @param {object} state - Current PortfolioProject state
 * @returns {object} Serializable project state
 */
export function serializeProjectState(state) {
  if (!state) return null;

  return {
    version: 1,
    timestamp: Date.now(),
    student: { ...(state.student || {}) },
    frontCover: {
      source: state.frontCover?.source || 'template',
      templateId: state.frontCover?.templateId || 'minimal-school',
      isLocked: true
    },
    images: (state.images || []).map((img, idx) => ({
      id: img.id,
      originalFilename: img.originalFilename || `image_${idx + 1}.jpg`,
      order: img.order ?? idx,
      rotation: img.rotation || 0,
      width: img.width || 0,
      height: img.height || 0
      // Note: In Phase 2/IndexedDB, binary image blobs will be stored in an IndexedDB object store
    })),
    backCover: {
      source: state.backCover?.source || 'template',
      templateId: state.backCover?.templateId || 'minimal-school',
      isLocked: true
    },
    watermark: { ...(state.watermark || {}) },
    pdfSettings: { ...(state.pdfSettings || {}) },
    output: { ...(state.output || {}) }
  };
}

/**
 * Storage interface placeholder for upcoming IndexedDB integration.
 */
export const DraftStorage = {
  async saveDraft(state) {
    const serialized = serializeProjectState(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      return true;
    } catch {
      // Ignore quota errors in skeleton phase
      return false;
    }
  },

  async loadDraft() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
};
