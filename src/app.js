/**
 * Wangwon Portfolio - Application Entry Point
 * Bootstraps modular UI components and initializes state.
 */
import { projectStore } from './portfolio/portfolio-state.js';
import { initStudentForm } from './ui/student-form.js';
import { initWorkspace } from './ui/workspace.js';
import { initSettingsPanel } from './ui/settings-panel.js';
import { initPreviewActions } from './ui/preview.js';

document.addEventListener('DOMContentLoaded', () => {
  console.info('🚀 Wangwon Portfolio v0.1.0 initialized (Client-side & Privacy-First)');

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

  // Expose store for debugging in development if needed
  window.__WANGWON_STORE__ = projectStore;
});
