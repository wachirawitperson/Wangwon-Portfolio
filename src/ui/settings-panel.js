import {
  projectStore,
  setCoverTemplate,
  setWatermarkEnabled,
  setWatermarkSourceType,
  setCustomWatermark,
  replaceCustomWatermark,
  removeCustomWatermark,
  updateWatermarkSettings,
  updateWatermark
} from '../portfolio/portfolio-state.js';
import { isSupportedImage } from '../core/file-utils.js';
import { decodeHeicIfNeeded, createPreviewUrl, getImageDimensions } from '../core/image-utils.js';
import { showToast } from './notifications.js';

export function initSettingsPanel(panelElement) {
  if (!panelElement) return;

  const orientationSelect = panelElement.querySelector('#setting-orientation');
  const placementButtons = panelElement.querySelectorAll('[data-setting="placement"]');
  const qualitySelect = panelElement.querySelector('#setting-quality');
  const qualityButtons = panelElement.querySelectorAll('[data-setting="quality"]');
  const templateCards = panelElement.querySelectorAll('.template-card');

  function updateTemplateUI(activeId) {
    templateCards.forEach((card) => {
      const isMatch = card.dataset.templateId === activeId;
      card.classList.toggle('is-active', isMatch);
      card.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    });
  }

  // Cover Template Bento selector events (Click + Keyboard ArrowLeft/Right/Space/Enter)
  templateCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.templateId;
      if (!templateId) return;
      updateTemplateUI(templateId);
      setCoverTemplate(templateId);
      showToast(`เปลี่ยนรูปแบบปกเป็น ${card.querySelector('.template-name')?.textContent || templateId} เรียบร้อยแล้ว`, 'info');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        card.click();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = (idx + 1) % templateCards.length;
        templateCards[nextIdx].focus();
        templateCards[nextIdx].click();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = (idx - 1 + templateCards.length) % templateCards.length;
        templateCards[prevIdx].focus();
        templateCards[prevIdx].click();
      }
    });
  });

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
  const watermarkScaleSlider = panelElement.querySelector('#watermark-scale-slider');
  const watermarkScaleVal = panelElement.querySelector('#watermark-scale-val');
  const positionCells = panelElement.querySelectorAll('.position-cell');
  const watermarkTargetButtons = panelElement.querySelectorAll('[data-setting="applyTo"]');

  function updateSegmentedUI(buttons, activeValue) {
    buttons.forEach((btn) => {
      const isMatch = btn.dataset.value === activeValue;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    });
  }

  function updatePositionGridUI(activePosition) {
    positionCells.forEach((cell) => {
      const isMatch = cell.dataset.position === activePosition;
      cell.classList.toggle('is-active', isMatch);
      cell.setAttribute('aria-checked', isMatch ? 'true' : 'false');
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
      setWatermarkEnabled(enabled);
      if (watermarkOptionsContainer) {
        watermarkOptionsContainer.style.display = enabled ? 'flex' : 'none';
      }
    });
  }

  // School Emblem Watermark Option
  if (watermarkSchoolCheckbox) {
    watermarkSchoolCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        setWatermarkSourceType('school-logo');
        showToast('เลือกลายน้ำตราโรงเรียนบ้านวังวนแล้ว', 'info');
      } else {
        const currentWatermark = projectStore.getState().watermark;
        if (currentWatermark.custom?.previewUrl) {
          setWatermarkSourceType('custom');
        } else {
          setWatermarkSourceType('none');
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
      let width = 200;
      let height = 200;
      try {
        const dims = await getImageDimensions(decoded.blob);
        width = dims.width;
        height = dims.height;
      } catch (dimErr) {
        console.warn('Could not read custom watermark dimensions:', dimErr);
      }

      setCustomWatermark(file, previewUrl, decoded.mimeType, width, height);
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
      removeCustomWatermark();
      showToast('ลบลายน้ำเรียบร้อย', 'info');
    });
  }

  if (watermarkOpacitySlider) {
    watermarkOpacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const opacity = parseFloat((val / 100).toFixed(2));
      if (watermarkOpacityVal) {
        watermarkOpacityVal.textContent = `${val}%`;
      }
      updateWatermarkSettings({ opacity });
    });
  }

  if (watermarkScaleSlider) {
    watermarkScaleSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const scale = parseFloat((val / 100).toFixed(2));
      if (watermarkScaleVal) {
        watermarkScaleVal.textContent = `${val}%`;
      }
      updateWatermarkSettings({ scale });
    });
  }

  // Watermark 3x3 Position Grid buttons
  positionCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      const position = cell.dataset.position;
      if (!position) return;
      updatePositionGridUI(position);
      updateWatermarkSettings({ position });
    });
  });

  // Watermark ApplyTo target buttons
  watermarkTargetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const applyTo = btn.dataset.value;
      if (!applyTo) return;
      updateSegmentedUI(watermarkTargetButtons, applyTo);
      updateWatermarkSettings({ applyTo });
    });
  });

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
      watermarkSchoolCheckbox.checked = (wm.sourceType === 'school-logo');
    }

    const customUrl = wm.custom?.previewUrl;
    if (customUrl) {
      if (watermarkPlaceholder) watermarkPlaceholder.style.display = 'none';
      if (watermarkThumbnailBox) watermarkThumbnailBox.style.display = 'flex';
      if (watermarkPreviewImg) watermarkPreviewImg.src = customUrl;
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

    if (watermarkScaleSlider && wm.scale !== undefined) {
      const scalePct = Math.round(wm.scale * 100);
      watermarkScaleSlider.value = scalePct;
      if (watermarkScaleVal) watermarkScaleVal.textContent = `${scalePct}%`;
    }

    if (positionCells.length > 0) {
      updatePositionGridUI(wm.position || 'bottom-right');
    }

    if (watermarkTargetButtons.length > 0) {
      updateSegmentedUI(watermarkTargetButtons, wm.applyTo || 'activity-only');
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

    // Cover template sync
    const currentTemplate = state.frontCover?.templateId || 'minimal-school';
    updateTemplateUI(currentTemplate);
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

  const initTemplate = initialState.frontCover?.templateId || 'minimal-school';
  updateTemplateUI(initTemplate);

  if (watermarkToggle) {
    watermarkToggle.checked = !!initWm.enabled;
  }
  if (watermarkOptionsContainer) {
    watermarkOptionsContainer.style.display = initWm.enabled ? 'flex' : 'none';
  }
  if (watermarkSchoolCheckbox) {
    watermarkSchoolCheckbox.checked = (initWm.sourceType === 'school-logo');
  }
  if (watermarkOpacitySlider) {
    const pct = Math.round((initWm.opacity !== undefined ? initWm.opacity : 0.18) * 100);
    watermarkOpacitySlider.value = pct;
    if (watermarkOpacityVal) watermarkOpacityVal.textContent = `${pct}%`;
  }
  if (watermarkScaleSlider) {
    const scalePct = Math.round((initWm.scale !== undefined ? initWm.scale : 0.18) * 100);
    watermarkScaleSlider.value = scalePct;
    if (watermarkScaleVal) watermarkScaleVal.textContent = `${scalePct}%`;
  }
  if (positionCells.length > 0) {
    updatePositionGridUI(initWm.position || 'bottom-right');
  }
  if (watermarkTargetButtons.length > 0) {
    updateSegmentedUI(watermarkTargetButtons, initWm.applyTo || 'activity-only');
  }
}
