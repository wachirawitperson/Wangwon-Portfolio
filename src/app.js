/**
 * Wangwon Portfolio - Application Entry Point (Phase 3 Student State & App Flow)
 * Bootstraps modular UI components, accessible modal dialogs, and initializes state.
 */
import {
  projectStore,
  createDefaultProjectState,
  resetPortfolioProject,
  updateStudentField,
  updateStudent
} from './portfolio/portfolio-state.js';
import { initStudentForm, clearAllFormValidationErrors, validateAndHighlightStudentForm } from './ui/student-form.js';
import { initWorkspace } from './ui/workspace.js';
import { initSettingsPanel } from './ui/settings-panel.js';
import { initPreviewActions } from './ui/preview.js';
import { openModal, closeModal } from './ui/modal.js';
import { showToast } from './ui/notifications.js';
import {
  validateStudentInformation,
  getStudentDisplayName,
  getDefaultAcademicYear,
  normalizeStudentData
} from './core/student-utils.js';
import { generatePdfFilename, sanitizeFilename } from './core/filename-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('🚀 Wangwon Portfolio v0.3.0 initialized (Student Information + Reactive App State)');

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

  // Confirm Reset Action
  const btnConfirmReset = document.querySelector('#btn-confirm-reset');
  if (btnConfirmReset && resetModal) {
    btnConfirmReset.addEventListener('click', () => {
      resetPortfolioProject();
      clearAllFormValidationErrors();
      closeModal(resetModal);
      showToast('เริ่มโครงการใหม่เรียบร้อยแล้ว', 'info');
    });
  }

  // Expose store & helpers for testing & development
  window.__WANGWON_STORE__ = projectStore;
  window.__WANGWON_MODAL__ = { openModal, closeModal };
  window.__WANGWON_TOAST__ = { showToast };
  window.__WANGWON_FILENAME_UTILS__ = {
    generatePdfFilename,
    sanitizeFilename
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
    resetPortfolioProject
  };
});
