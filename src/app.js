/**
 * Wangwon Portfolio - Application Entry Point (Phase 3 Student State & App Flow)
 * Bootstraps modular UI components, accessible modal dialogs, and initializes state.
 */
import {
  projectStore,
  createDefaultProjectState,
  resetPortfolioProject,
  hydrateProjectState,
  updateStudentField,
  updateStudent,
  updateStudentPhoto,
  clearStudentPhoto,
  updateWatermark
} from './portfolio/portfolio-state.js';
import { initTheme, getTheme, setTheme, toggleTheme, subscribeTheme } from './core/theme-manager.js';
import { initStudentForm, clearAllFormValidationErrors, validateAndHighlightStudentForm } from './ui/student-form.js';
import { initWorkspace } from './ui/workspace.js';
import { initSettingsPanel } from './ui/settings-panel.js';
import { initPreviewActions } from './ui/preview.js';
import { openModal, closeModal } from './ui/modal.js';
import { showToast } from './ui/notifications.js';
import {
  openDraftDb,
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  migrateDraftRecord,
  rehydrateDraftState,
  hasMeaningfulProjectData
} from './core/draft-storage.js';
import { autosaveManager } from './core/autosave-manager.js';
import { initRecoveryModal } from './ui/recovery-modal.js';
import {
  validateStudentInformation,
  getStudentDisplayName,
  getDefaultAcademicYear,
  normalizeStudentData
} from './core/student-utils.js';
import {
  generatePdfFilename,
  sanitizeFilename,
  getStudentExportBaseName,
  getExportImageFilename,
  getExportPackageFilename
} from './core/filename-utils.js';
import {
  createPreviewUrl,
  revokePreviewUrl,
  getImageDimensions,
  assessImageQuality,
  buildDuplicateKey,
  decodeHeicIfNeeded
} from './core/image-utils.js';
import {
  importStudentImages,
  addStudentImages,
  removeStudentImage,
  rotateStudentImage,
  reorderStudentImages,
  clearAllStudentImages,
  moveImageEarlier,
  moveImageLater,
  reorderImageByIndex,
  replaceStudentImage,
  duplicateStudentImage
} from './portfolio/image-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('🚀 Wangwon Portfolio v0.3.0 initialized (Student Information + Reactive App State)');

  // Initialize Theme System (Light / Dark)
  initTheme();

  // Initialize Student Form
  const studentForm = document.querySelector('#student-info-form');
  initStudentForm(studentForm);

  // Initialize Workspace (Front Cover, Images, Back Cover)
  const workspace = document.querySelector('#portfolio-workspace');
  initWorkspace(workspace);

  // Initialize Settings Panel
  const settingsPanel = document.querySelector('#settings-panel');
  initSettingsPanel(settingsPanel);

  // Initialize Preview & Export action buttons
  const actionToolbar = document.querySelector('#action-toolbar');
  initPreviewActions(actionToolbar);

  // Initialize Autosave Status Indicator (Phase 12)
  const autosaveIndicator = document.querySelector('#autosave-status-indicator');
  const autosaveText = document.querySelector('#autosave-status-text');

  autosaveManager.subscribe(({ status, formattedTime }) => {
    if (!autosaveIndicator) return;
    autosaveIndicator.dataset.status = status;

    if (autosaveText) {
      if (status === 'saving') {
        autosaveText.textContent = 'กำลังบันทึก...';
      } else if (status === 'saved') {
        autosaveText.textContent = formattedTime ? `บันทึกล่าสุด ${formattedTime}` : 'บันทึกแล้ว';
      } else if (status === 'error') {
        autosaveText.textContent = 'บันทึกร่างไม่สำเร็จ';
      } else {
        autosaveText.textContent = 'บันทึกอัตโนมัติ';
      }
    }
  });

  // Centralized Auto-Save Subscription (Phase 12)
  projectStore.subscribe((state) => {
    autosaveManager.scheduleSave(state);
  });

  // Listen for autosave error toast notifications
  window.addEventListener('wangwon:autosave-error', (e) => {
    const { message } = e.detail;
    if (message) {
      showToast(message, 'warning');
    }
  });

  // Header Modal Triggers: Help & Reset Project
  const btnHelp = document.querySelector('#btn-help');
  const helpModal = document.querySelector('#help-modal');
  if (btnHelp && helpModal) {
    btnHelp.addEventListener('click', () => {
      openModal(helpModal, btnHelp);
    });
  }

  const btnReset = document.querySelector('#btn-reset-project');
  const resetModal = document.querySelector('#reset-confirm-modal');
  if (btnReset && resetModal) {
    btnReset.addEventListener('click', () => {
      openModal(resetModal, btnReset);
    });
  }

  // Confirm Reset Action (Phase 12: Clears memory & deletes draft from IndexedDB)
  const btnConfirmReset = document.querySelector('#btn-confirm-reset');
  if (btnConfirmReset && resetModal) {
    btnConfirmReset.addEventListener('click', async () => {
      autosaveManager.pause();
      resetPortfolioProject();
      clearAllFormValidationErrors();
      closeModal(resetModal);

      try {
        await deleteDraft();
      } catch (err) {
        console.warn('[DraftStorage] Failed to delete draft on project reset:', err);
      }

      autosaveManager.setStatus('idle');
      autosaveManager.resume();
      showToast('เริ่มโครงการใหม่เรียบร้อยแล้ว', 'info');
    });
  }

  // Startup Recovery Modal (Phase 12)
  initRecoveryModal();

  // Expose store & helpers for testing & development
  window.__WANGWON_STORE__ = projectStore;
  window.__WANGWON_MODAL__ = { openModal, closeModal };
  window.__WANGWON_TOAST__ = { showToast };
  window.__WANGWON_DRAFT_STORAGE__ = {
    openDraftDb,
    saveDraft,
    loadDraft,
    deleteDraft,
    hasDraft,
    migrateDraftRecord,
    rehydrateDraftState,
    hasMeaningfulProjectData,
    autosaveManager,
    hydrateProjectState
  };
  window.__WANGWON_FILENAME_UTILS__ = {
    generatePdfFilename,
    sanitizeFilename,
    getStudentExportBaseName,
    getExportImageFilename,
    getExportPackageFilename
  };
  window.__WANGWON_STUDENT_UTILS__ = {
    validateStudentInformation,
    getStudentDisplayName,
    getDefaultAcademicYear,
    normalizeStudentData,
    validateAndHighlightStudentForm,
    clearAllFormValidationErrors,
    updateStudentField,
    updateStudent,
    updateStudentPhoto,
    clearStudentPhoto,
    updateWatermark,
    resetPortfolioProject
  };
  window.__WANGWON_IMAGE_UTILS__ = {
    createPreviewUrl,
    revokePreviewUrl,
    getImageDimensions,
    assessImageQuality,
    buildDuplicateKey,
    decodeHeicIfNeeded
  };
  window.__WANGWON_IMAGE_MANAGER__ = {
    importStudentImages,
    addStudentImages,
    removeStudentImage,
    rotateStudentImage,
    reorderStudentImages,
    clearAllStudentImages,
    moveImageEarlier,
    moveImageLater,
    reorderImageByIndex,
    replaceStudentImage,
    duplicateStudentImage
  };

  window.__WANGWON_THEME_MANAGER__ = {
    getTheme,
    setTheme,
    toggleTheme,
    subscribeTheme
  };

  import('./portfolio/cover-manager.js').then((m) => {
    window.__WANGWON_COVER_MANAGER__ = m;
  });
  import('./portfolio/cover-generator.js').then((m) => {
    window.__WANGWON_COVER_GENERATOR__ = m;
  });
  import('./portfolio/portfolio-state.js').then((m) => {
    window.__WANGWON_COVER_STATE__ = {
      setCoverTemplate: m.setCoverTemplate,
      setCustomCover: m.setCustomCover,
      resetCoverToGenerated: m.resetCoverToGenerated
    };
  });

  Promise.all([
    import('./portfolio/watermark-renderer.js'),
    import('./portfolio/watermark.js'),
    import('./portfolio/portfolio-state.js')
  ]).then(([renderer, wmConstants, stateModule]) => {
    window.__WANGWON_WATERMARK__ = {
      ...renderer,
      ...wmConstants,
      setWatermarkEnabled: stateModule.setWatermarkEnabled,
      setWatermarkSourceType: stateModule.setWatermarkSourceType,
      setCustomWatermark: stateModule.setCustomWatermark,
      replaceCustomWatermark: stateModule.replaceCustomWatermark,
      removeCustomWatermark: stateModule.removeCustomWatermark,
      updateWatermarkSettings: stateModule.updateWatermarkSettings,
      updateWatermark: stateModule.updateWatermark
    };
  });

  Promise.all([
    import('./portfolio/pdf-generator.js'),
    import('./portfolio/page-renderer.js')
  ]).then(([pdfGen, pageRenderer]) => {
    window.__WANGWON_PDF_GENERATOR__ = {
      ...pdfGen,
      ...pageRenderer
    };
  });

  import('./portfolio/image-exporter.js').then((imgExp) => {
    window.__WANGWON_IMAGE_EXPORTER__ = imgExp;
  });

  import('./portfolio/package-exporter.js').then((pkgExp) => {
    window.__WANGWON_PACKAGE_EXPORTER__ = pkgExp;
  });
});
