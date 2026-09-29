/**
 * Settings Panel Component (Phase 2 Design System)
 * Configures paper size, placement, quality presets, and watermark toggles
 * using accessible form controls and segmented pill switches.
 */
import { projectStore } from '../portfolio/portfolio-state.js';

export function initSettingsPanel(panelElement) {
  if (!panelElement) return;

  const orientationSelect = panelElement.querySelector('#setting-orientation');
  const placementButtons = panelElement.querySelectorAll('[data-setting="placement"]');
  const qualityButtons = panelElement.querySelectorAll('[data-setting="quality"]');
  const watermarkToggle = panelElement.querySelector('#setting-watermark-enabled');

  function updateSegmentedUI(buttons, activeValue) {
    buttons.forEach((btn) => {
      const isMatch = btn.dataset.value === activeValue;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    });
  }

  // Placement segmented control handler
  placementButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      updateSegmentedUI(placementButtons, value);
      projectStore.setState((state) => ({
        pdfSettings: {
          ...state.pdfSettings,
          placement: value
        }
      }));
    });
  });

  // Quality segmented control handler
  qualityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      updateSegmentedUI(qualityButtons, value);
      projectStore.setState((state) => ({
        pdfSettings: {
          ...state.pdfSettings,
          quality: value
        }
      }));
    });
  });

  // Orientation select handler
  if (orientationSelect) {
    orientationSelect.addEventListener('change', (e) => {
      projectStore.setState((state) => ({
        pdfSettings: {
          ...state.pdfSettings,
          orientation: e.target.value
        }
      }));
    });
  }

  // Watermark toggle handler
  if (watermarkToggle) {
    watermarkToggle.addEventListener('change', (e) => {
      projectStore.setState((state) => ({
        watermark: {
          ...state.watermark,
          enabled: e.target.checked
        }
      }));
    });
  }

  // Sync UI from initial state
  const initialState = projectStore.getState();
  if (orientationSelect && initialState.pdfSettings?.orientation) {
    orientationSelect.value = initialState.pdfSettings.orientation;
  }
  updateSegmentedUI(placementButtons, initialState.pdfSettings?.placement || 'fit');
  updateSegmentedUI(qualityButtons, initialState.pdfSettings?.quality || 'balanced');
  if (watermarkToggle) {
    watermarkToggle.checked = !!initialState.watermark?.enabled;
  }
}
