/**
 * Settings Panel Component (Phase 4.5 Soft Workspace)
 * Configures paper size, placement, quality presets, and watermark options.
 */
import { projectStore, updateWatermark } from '../portfolio/portfolio-state.js';
import { isSupportedImage } from '../core/file-utils.js';
import { decodeHeicIfNeeded, createPreviewUrl } from '../core/image-utils.js';
import { showToast } from './notifications.js';

export function initSettingsPanel(panelElement) {
  if (!panelElement) return;

  const orientationSelect = panelElement.querySelector('#setting-orientation');
  const placementButtons = panelElement.querySelectorAll('[data-setting="placement"]');
  const qualitySelect = panelElement.querySelector('#setting-quality');
  const qualityButtons = panelElement.querySelectorAll('[data-setting="quality"]');

  // Watermark Elements
  const watermarkToggle = panelElement.querySelector('#setting-watermark-enabled');
  const watermarkOptionsContainer = panelElement.querySelector('#watermark-options-container');
  const watermarkSchoolCheckbox = panelElement.querySelector('#setting-watermark-school');
  const watermarkFileInput = panelElement.querySelector('#watermark-file-input');
  const btnUploadWatermark = panelElement.querySelector('#btn-upload-watermark');
  const btnReplaceWatermark = panelElement.querySelector('#btn-replace-watermark');
  const btnRemoveWatermark = panelElement.querySelector('#btn-remove-watermark');
  const watermarkPlaceholder = panelElement.querySelector('#watermark-upload-placeholder');
  const watermarkThumbnailBox = panelElement.querySelector('#watermark-thumbnail-box');
  const watermarkPreviewImg = panelElement.querySelector('#watermark-preview-img');
  const watermarkOpacitySlider = panelElement.querySelector('#watermark-opacity-slider');
  const watermarkOpacityVal = panelElement.querySelector('#watermark-opacity-val');

  function updateSegmentedUI(buttons, activeValue) {
    buttons.forEach((btn) => {
      const isMatch = btn.dataset.value === activeValue;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    });
  }

  // 1. Placement segmented control
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

  // 2. Quality segmented / select control
  qualityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      updateSegmentedUI(qualityButtons, value);
      if (qualitySelect) qualitySelect.value = value;
      projectStore.setState((state) => ({
        pdfSettings: {
          ...state.pdfSettings,
          quality: value
        }
      }));
    });
  });

  if (qualitySelect) {
    qualitySelect.addEventListener('change', (e) => {
      const value = e.target.value;
      updateSegmentedUI(qualityButtons, value);
      projectStore.setState((state) => ({
        pdfSettings: {
          ...state.pdfSettings,
          quality: value
        }
      }));
    });
  }

  // 3. Orientation select
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

  // 4. Watermark Handlers
  if (watermarkToggle) {
    watermarkToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      updateWatermark({ enabled });
      if (watermarkOptionsContainer) {
        watermarkOptionsContainer.style.display = enabled ? 'flex' : 'none';
      }
    });
  }

  // School Emblem Watermark Option
  if (watermarkSchoolCheckbox) {
    watermarkSchoolCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        updateWatermark({
          type: 'school',
          previewUrl: './assets/branding/ban-wangwon-logo.png'
        });
        showToast('เลือกลายน้ำตราโรงเรียนบ้านวังวนแล้ว', 'info');
      } else {
        // If unchecking school and no custom file, revert type to null
        const currentWatermark = projectStore.getState().watermark;
        if (currentWatermark?.file) {
          updateWatermark({ type: 'custom' });
        } else {
          updateWatermark({ type: null, previewUrl: null });
        }
      }
    });
  }

  // Custom Watermark Upload
  async function handleWatermarkFile(file) {
    if (!file) return;

    if (!isSupportedImage(file)) {
      showToast('ไม่รองรับประเภทไฟล์นี้สำหรับลายน้ำ (รองรับ PNG, JPG, WebP)', 'warning');
      return;
    }

    try {
      const decoded = await decodeHeicIfNeeded(file);
      const previewUrl = createPreviewUrl(decoded.blob);

      // Uncheck school emblem checkbox when custom uploaded
      if (watermarkSchoolCheckbox) {
        watermarkSchoolCheckbox.checked = false;
      }

      updateWatermark({
        type: 'custom',
        file,
        previewUrl,
        mimeType: decoded.mimeType
      });

      showToast('อัปโหลดภาพลายน้ำเรียบร้อย', 'success');
    } catch (err) {
      console.error('Watermark upload error:', err);
      showToast('ไม่สามารถเปิดไฟล์รูปลายน้ำได้', 'danger');
    } finally {
      if (watermarkFileInput) watermarkFileInput.value = '';
    }
  }

  [btnUploadWatermark, btnReplaceWatermark].forEach((btn) => {
    if (btn && watermarkFileInput) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        watermarkFileInput.click();
      });
    }
  });

  if (watermarkFileInput) {
    watermarkFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleWatermarkFile(file);
      }
    });
  }

  if (btnRemoveWatermark) {
    btnRemoveWatermark.addEventListener('click', () => {
      if (watermarkSchoolCheckbox) {
        watermarkSchoolCheckbox.checked = false;
      }
      updateWatermark({
        type: null,
        file: null,
        previewUrl: null
      });
      showToast('ลบลายน้ำเรียบร้อย', 'info');
    });
  }

  if (watermarkOpacitySlider) {
    watermarkOpacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const opacity = val / 100;
      if (watermarkOpacityVal) {
        watermarkOpacityVal.textContent = `${val}%`;
      }
      updateWatermark({ opacity });
    });
  }

  // Subscribe to store updates for UI synchronization
  projectStore.subscribe((state) => {
    const wm = state.watermark || {};
    const pdf = state.pdfSettings || {};

    // Watermark UI sync
    if (watermarkToggle) {
      watermarkToggle.checked = !!wm.enabled;
    }
    if (watermarkOptionsContainer) {
      watermarkOptionsContainer.style.display = wm.enabled ? 'flex' : 'none';
    }
    if (watermarkSchoolCheckbox) {
      watermarkSchoolCheckbox.checked = wm.type === 'school';
    }

    if (wm.previewUrl) {
      if (watermarkPlaceholder) watermarkPlaceholder.style.display = 'none';
      if (watermarkThumbnailBox) watermarkThumbnailBox.style.display = 'flex';
      if (watermarkPreviewImg) watermarkPreviewImg.src = wm.previewUrl;
    } else {
      if (watermarkPlaceholder) watermarkPlaceholder.style.display = 'flex';
      if (watermarkThumbnailBox) watermarkThumbnailBox.style.display = 'none';
      if (watermarkPreviewImg) watermarkPreviewImg.removeAttribute('src');
    }

    if (watermarkOpacitySlider && wm.opacity !== undefined) {
      const pct = Math.round(wm.opacity * 100);
      watermarkOpacitySlider.value = pct;
      if (watermarkOpacityVal) watermarkOpacityVal.textContent = `${pct}%`;
    }

    // PDF settings sync
    if (orientationSelect && pdf.orientation) {
      orientationSelect.value = pdf.orientation;
    }
    if (qualitySelect && pdf.quality) {
      qualitySelect.value = pdf.quality;
    }
    updateSegmentedUI(placementButtons, pdf.placement || 'fit');
    updateSegmentedUI(qualityButtons, pdf.quality || 'balanced');
  });

  // Initial Sync
  const initialState = projectStore.getState();
  const initWm = initialState.watermark || {};
  const initPdf = initialState.pdfSettings || {};

  if (orientationSelect && initPdf.orientation) {
    orientationSelect.value = initPdf.orientation;
  }
  if (qualitySelect && initPdf.quality) {
    qualitySelect.value = initPdf.quality;
  }
  updateSegmentedUI(placementButtons, initPdf.placement || 'fit');
  updateSegmentedUI(qualityButtons, initPdf.quality || 'balanced');

  if (watermarkToggle) {
    watermarkToggle.checked = !!initWm.enabled;
  }
  if (watermarkOptionsContainer) {
    watermarkOptionsContainer.style.display = initWm.enabled ? 'flex' : 'none';
  }
  if (watermarkSchoolCheckbox) {
    watermarkSchoolCheckbox.checked = initWm.type === 'school';
  }
  if (watermarkOpacitySlider) {
    const pct = Math.round((initWm.opacity || 0.15) * 100);
    watermarkOpacitySlider.value = pct;
    if (watermarkOpacityVal) watermarkOpacityVal.textContent = `${pct}%`;
  }
}
