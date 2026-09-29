/**
 * Settings Panel Component
 * Controls for PDF configuration (paper size, orientation, placement, quality)
 * and watermark options.
 */
import { projectStore } from '../portfolio/portfolio-state.js';

export function initSettingsPanel(panelElement) {
  if (!panelElement) return;

  const orientationSelect = panelElement.querySelector('#setting-orientation');
  const placementSelect = panelElement.querySelector('#setting-placement');
  const qualitySelect = panelElement.querySelector('#setting-quality');
  const watermarkToggle = panelElement.querySelector('#setting-watermark-enabled');
  const watermarkText = panelElement.querySelector('#setting-watermark-text');

  function syncSettingsToState() {
    const currentState = projectStore.getState();

    projectStore.setState({
      pdfSettings: {
        ...currentState.pdfSettings,
        orientation: orientationSelect ? orientationSelect.value : 'portrait',
        placement: placementSelect ? placementSelect.value : 'fit',
        quality: qualitySelect ? qualitySelect.value : 'balanced'
      },
      watermark: {
        ...currentState.watermark,
        enabled: watermarkToggle ? watermarkToggle.checked : false
      }
    });
  }

  [orientationSelect, placementSelect, qualitySelect, watermarkToggle, watermarkText].forEach(
    (el) => {
      if (el) {
        el.addEventListener('change', syncSettingsToState);
      }
    }
  );
}
