/**
 * Portfolio Workspace Component (Phase 2 Design System)
 * Orchestrates the visual sequence:
 * [Locked Front Cover (Page 1)] -> [Empty Image State / Student Images] -> [Locked Back Cover (Last Page)]
 */
import { projectStore, setCustomCover, resetCoverToGenerated } from '../portfolio/portfolio-state.js';
import { importStudentImages, removeStudentImage } from '../portfolio/image-manager.js';
import { createImageCard } from './image-card.js';
import { COVER_TEMPLATES, getCoverTemplate } from '../portfolio/cover-manager.js';
import { generateCoverDataUrl } from '../portfolio/cover-generator.js';
import { isSupportedImage } from '../core/file-utils.js';
import { decodeHeicIfNeeded, getImageDimensions, createPreviewUrl } from '../core/image-utils.js';
import {
  getWatermarkCssOverlayStyle,
  getWatermarkImageSrc,
  shouldApplyWatermark
} from '../portfolio/watermark-renderer.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modal.js';
import { icons } from './icons.js';

export function initWorkspace(workspaceElement) {
  if (!workspaceElement) return;

  const frontCoverCard = workspaceElement.querySelector('#front-cover-card');
  const studentImagesContainer = workspaceElement.querySelector('#student-images-container');
  const emptyPlaceholder = workspaceElement.querySelector('#images-empty-placeholder');
  const addImagesInput = workspaceElement.querySelector('#file-upload-input');
  const addImagesBtn = workspaceElement.querySelector('#btn-add-images');
  const addImagesEmptyBtn = workspaceElement.querySelector('#btn-empty-add-images');
  const backCoverCard = workspaceElement.querySelector('#back-cover-card');
  const totalPagesBadge = document.querySelector('#total-pages-badge');
  const imageCountBadge = document.querySelector('#image-count-badge');
  const duplicateModal = document.querySelector('#duplicate-modal');
  const btnSkipDuplicates = document.querySelector('#btn-skip-duplicates');
  const btnAllowDuplicates = document.querySelector('#btn-allow-duplicates');
  const duplicateFileList = document.querySelector('#duplicate-file-list');
  const duplicateSummaryText = document.querySelector('#duplicate-summary-text');

  let pendingDuplicateBatch = null;

  async function processFiles(files, source = 'file-picker') {
    if (!files || files.length === 0) return;

    try {
      const result = await importStudentImages(files, { source, allowDuplicates: false });

      // Feedback for unsupported files
      if (result.unsupported.length > 0) {
        showToast(
          `ไม่รองรับไฟล์: ${result.unsupported.slice(0, 2).join(', ')}${result.unsupported.length > 2 ? ` และอีก ${result.unsupported.length - 2} ไฟล์` : ''} (รองรับ JPG, PNG, WebP, BMP, HEIC)`,
          'warning'
        );
      }

      // Feedback for corrupted/unreadable files
      if (result.corrupted.length > 0) {
        showToast(
          `ไม่สามารถเปิดไฟล์รูปภาพได้: ${result.corrupted.slice(0, 2).join(', ')}${result.corrupted.length > 2 ? ` และอีก ${result.corrupted.length - 2} ไฟล์` : ''}`,
          'danger'
        );
      }

      // Feedback for low-resolution images
      if (result.lowResolution.length > 0) {
        showToast(
          `พบ ${result.lowResolution.length} ภาพที่มีความละเอียดต่ำกว่าเกณฑ์มาตรฐาน อาจพิมพ์ไม่คมชัด`,
          'info'
        );
      }

      // Success feedback for imported files
      if (result.imported.length > 0) {
        showToast(`เพิ่มรูปภาพเรียบร้อย (${result.imported.length} ภาพ)`, 'success');
      }

      // Handle duplicate files via modal
      if (result.duplicates.length > 0 && duplicateModal) {
        pendingDuplicateBatch = result.duplicates;
        if (duplicateSummaryText) {
          duplicateSummaryText.textContent = `พบรูปภาพ ${result.duplicates.length} ภาพที่มีชื่อหรือขนาดตรงกับภาพในระบบแล้ว:`;
        }
        if (duplicateFileList) {
          duplicateFileList.innerHTML = result.duplicates
            .map((dup) => `<li><strong>${dup.name}</strong> (ตรงกับ: ${dup.existingName})</li>`)
            .join('');
        }
        openModal(duplicateModal);
      }
    } catch (err) {
      console.error('File import error:', err);
      showToast('เกิดข้อผิดพลาดในการนำเข้ารูปภาพ', 'danger');
    } finally {
      if (addImagesInput) addImagesInput.value = '';
    }
  }

  // Duplicate modal button events
  if (btnSkipDuplicates && duplicateModal) {
    btnSkipDuplicates.addEventListener('click', () => {
      closeModal(duplicateModal);
      showToast(`ข้ามรูปภาพที่ซ้ำ ${pendingDuplicateBatch?.length || 0} ภาพแล้ว`, 'info');
      pendingDuplicateBatch = null;
    });
  }

  if (btnAllowDuplicates && duplicateModal) {
    btnAllowDuplicates.addEventListener('click', async () => {
      if (pendingDuplicateBatch && pendingDuplicateBatch.length > 0) {
        const dupFiles = pendingDuplicateBatch.map((d) => d.file);
        closeModal(duplicateModal);
        const dupResult = await importStudentImages(dupFiles, { source: 'file-picker', allowDuplicates: true });
        showToast(`นำเข้ารูปภาพที่ซ้ำเรียบร้อย (${dupResult.imported.length} ภาพ)`, 'success');
        pendingDuplicateBatch = null;
      }
    });
  }

  // Trigger file selection from both upload buttons
  [addImagesBtn, addImagesEmptyBtn].forEach((btn) => {
    if (btn && addImagesInput) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addImagesInput.click();
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addImagesInput.click();
        }
      });
    }
  });

  if (emptyPlaceholder && addImagesInput) {
    emptyPlaceholder.addEventListener('click', () => {
      addImagesInput.click();
    });
    emptyPlaceholder.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addImagesInput.click();
      }
    });
  }

  if (addImagesInput) {
    addImagesInput.addEventListener('change', (e) => {
      processFiles(Array.from(e.target.files || []), 'file-picker');
    });
  }

  // Drag and drop onto workspaceElement and emptyPlaceholder (external files only)
  const dropTargets = [workspaceElement, emptyPlaceholder].filter(Boolean);
  dropTargets.forEach((target) => {
    target.addEventListener('dragover', (e) => {
      if (window.__WANGWON_DRAGGING_ID__) return;
      e.preventDefault();
      e.stopPropagation();
      target.classList.add('is-dragover');
    });

    target.addEventListener('dragleave', (e) => {
      if (window.__WANGWON_DRAGGING_ID__) return;
      e.preventDefault();
      e.stopPropagation();
      target.classList.remove('is-dragover');
    });

    target.addEventListener('drop', (e) => {
      if (window.__WANGWON_DRAGGING_ID__) return;
      e.preventDefault();
      e.stopPropagation();
      target.classList.remove('is-dragover');
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processFiles(Array.from(dt.files), 'drag-drop');
      }
    });
  });

  // Global Clipboard paste support (Ctrl/Cmd+V) when not inside text inputs
  window.addEventListener('paste', (e) => {
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT' ||
        active.isContentEditable)
    ) {
      return; // Do not intercept paste in form inputs
    }

    const clipboardData = e.clipboardData;
    if (!clipboardData || !clipboardData.items) return;

    const files = [];
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      processFiles(files, 'clipboard');
    }
  });

  // Local in-memory caches for rendered cover data URLs
  let cachedFrontCoverDataUrl = null;
  let cachedBackCoverDataUrl = null;
  let lastFrontRenderKey = '';
  let lastBackRenderKey = '';

  // Cover Preview Modal elements
  const coverPreviewModal = document.querySelector('#cover-preview-modal');
  const coverPreviewBadge = document.querySelector('#cover-preview-badge');
  const coverPreviewModalTitle = document.querySelector('#cover-preview-modal-title');
  const coverPreviewTabFront = document.querySelector('#cover-preview-tab-front');
  const coverPreviewTabBack = document.querySelector('#cover-preview-tab-back');
  const coverPreviewModalImg = document.querySelector('#cover-preview-modal-img');
  const coverPreviewTemplateText = document.querySelector('#cover-preview-template-text');
  const coverPreviewRes = document.querySelector('#cover-preview-res');

  const customFrontCoverInput = document.querySelector('#custom-front-cover-input');
  const customBackCoverInput = document.querySelector('#custom-back-cover-input');

  function openCoverPreview(type) {
    if (!coverPreviewModal) return;
    const state = projectStore.getState();
    const isFront = type === 'front';
    const coverState = isFront ? state.frontCover : state.backCover;
    const template = getCoverTemplate(coverState.templateId);
    const isLandscape = state.pdfSettings?.orientation === 'landscape';

    if (coverPreviewModalTitle) {
      coverPreviewModalTitle.textContent = isFront ? 'ตัวอย่างปกหน้า Portfolio' : 'ตัวอย่างปกหลัง Portfolio';
    }

    if (coverPreviewBadge) {
      coverPreviewBadge.textContent = isFront ? 'ปกหน้า (Page 1)' : `ปกหลัง (Page ${(state.images?.length || 0) + 2})`;
    }

    if (coverPreviewTabFront && coverPreviewTabBack) {
      if (isFront) {
        coverPreviewTabFront.classList.add('is-active');
        coverPreviewTabFront.setAttribute('aria-selected', 'true');
        coverPreviewTabBack.classList.remove('is-active');
        coverPreviewTabBack.setAttribute('aria-selected', 'false');
      } else {
        coverPreviewTabBack.classList.add('is-active');
        coverPreviewTabBack.setAttribute('aria-selected', 'true');
        coverPreviewTabFront.classList.remove('is-active');
        coverPreviewTabFront.setAttribute('aria-selected', 'false');
      }
    }

    const previewSrc = isFront
      ? (coverState.mode === 'custom' ? coverState.customPreviewUrl : cachedFrontCoverDataUrl)
      : (coverState.mode === 'custom' ? coverState.customPreviewUrl : cachedBackCoverDataUrl);

    if (coverPreviewModalImg && previewSrc) {
      coverPreviewModalImg.src = previewSrc;
    }

    if (coverPreviewTemplateText) {
      if (coverState.mode === 'custom') {
        coverPreviewTemplateText.textContent = 'ปกที่อัปโหลดเอง (Custom)';
      } else {
        coverPreviewTemplateText.textContent = `รูปแบบ: ${template.name}`;
      }
    }

    if (coverPreviewRes) {
      coverPreviewRes.textContent = isLandscape ? 'A4 แนวนอน (1754 × 1240 px)' : 'A4 แนวตั้ง (1240 × 1754 px)';
    }

    openModal(coverPreviewModal);
  }

  if (coverPreviewTabFront) {
    coverPreviewTabFront.addEventListener('click', (e) => {
      e.stopPropagation();
      openCoverPreview('front');
    });
  }

  if (coverPreviewTabBack) {
    coverPreviewTabBack.addEventListener('click', (e) => {
      e.stopPropagation();
      openCoverPreview('back');
    });
  }

  // Handle custom cover image file upload
  async function handleCustomCoverUpload(type, file) {
    if (!file) return;

    if (!isSupportedImage(file)) {
      showToast('ไฟล์ไม่ถูกต้อง รองรับ JPG, PNG, WebP, BMP, HEIC', 'warning');
      return;
    }

    try {
      const decoded = await decodeHeicIfNeeded(file);
      const previewUrl = createPreviewUrl(decoded.blob);
      const dims = await getImageDimensions(decoded.blob);

      // Aspect ratio check against A4 orientation
      const state = projectStore.getState();
      const isLandscape = state.pdfSettings?.orientation === 'landscape';
      const targetRatio = isLandscape ? 297 / 210 : 210 / 297;
      const imgRatio = dims.width / dims.height;

      if (Math.abs(imgRatio - targetRatio) / targetRatio > 0.15) {
        showToast('สัดส่วนภาพปกต่างจากกระดาษ อาจมีพื้นที่ว่างเมื่อสร้าง PDF', 'warning');
      }

      setCustomCover(type, file, previewUrl);
      showToast(`อัปโหลด${type === 'front' ? 'ปกหน้า' : 'ปกหลัง'}เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      console.error('Failed to load custom cover:', err);
      showToast('ไม่สามารถเปิดไฟล์รูปภาพปกได้', 'danger');
    }
  }

  if (customFrontCoverInput) {
    customFrontCoverInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleCustomCoverUpload('front', file);
      customFrontCoverInput.value = '';
    });
  }

  if (customBackCoverInput) {
    customBackCoverInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleCustomCoverUpload('back', file);
      customBackCoverInput.value = '';
    });
  }

  // Render Front Cover Card
  async function renderFrontCover(state) {
    if (!frontCoverCard) return;
    const front = state.frontCover || {};
    const template = getCoverTemplate(front.templateId);
    const isCustom = front.mode === 'custom' && front.customPreviewUrl;
    const isLandscape = state.pdfSettings?.orientation === 'landscape';

    // Unique render cache key
    const renderKey = `${front.templateId}|${state.pdfSettings?.orientation}|${state.student?.prefix}|${state.student?.firstName}|${state.student?.lastName}|${state.student?.grade}|${state.student?.studentNumber}|${state.student?.academicYear}|${state.studentPhoto?.previewUrl || ''}`;

    let coverImageSrc = front.customPreviewUrl;

    if (!isCustom) {
      if (renderKey !== lastFrontRenderKey || !cachedFrontCoverDataUrl) {
        lastFrontRenderKey = renderKey;
        try {
          cachedFrontCoverDataUrl = await generateCoverDataUrl({
            type: 'front',
            templateId: front.templateId,
            student: state.student,
            studentPhoto: state.studentPhoto,
            orientation: state.pdfSettings?.orientation || 'portrait'
          });
        } catch (err) {
          console.error('Front cover generation error:', err);
        }
      }
      coverImageSrc = cachedFrontCoverDataUrl;
    }

    frontCoverCard.innerHTML = `
      <div class="card-header locked-header">
        <span class="badge badge-locked" title="หน้านี้ถูกล็อคให้อยู่หน้าแรกเสมอ">
          <span class="icon-inline" aria-hidden="true">${icons.lock}</span> หน้า 1
        </span>
        <span class="cover-type-label">ปกหน้า</span>
        ${isCustom ? `
          <span class="cover-custom-badge">ปกที่อัปโหลดเอง</span>
        ` : `
          <span class="cover-template-badge">${template.shortName || template.name}</span>
        `}
      </div>
      <p class="cover-description">ปกหน้าจะอยู่หน้าแรกเสมอ</p>
      <div class="cover-card-body">
        <div class="cover-preview-canvas-wrap ${isLandscape ? 'is-landscape' : ''}">
          <img
            src="${coverImageSrc || './assets/branding/ban-wangwon-logo.png'}"
            alt="ตัวอย่างปกหน้า Portfolio"
            class="cover-preview-rendered-img"
            id="front-cover-rendered-img"
          />
        </div>
      </div>
      <div class="card-footer locked-footer">
        <div class="cover-card-actions">
          <button type="button" class="cover-action-btn btn-view-cover-modal" id="btn-view-large-front" aria-label="ดูปกหน้าขนาดใหญ่">
            ${icons.eye} ดูปกขนาดใหญ่
          </button>
          <button type="button" class="cover-action-btn btn-upload-cover" id="btn-upload-custom-front" aria-label="อัปโหลดปกหน้าเอง">
            ${icons.upload} อัปโหลดปกเอง
          </button>
          ${isCustom ? `
            <button type="button" class="cover-action-btn btn-reset-cover" id="btn-reset-front-cover" aria-label="กลับไปใช้ปกหน้าอัตโนมัติ">
              ${icons.refreshCw} ใช้ปกอัตโนมัติ
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Button event listeners
    const btnViewLarge = frontCoverCard.querySelector('#btn-view-large-front');
    if (btnViewLarge) {
      btnViewLarge.addEventListener('click', () => openCoverPreview('front'));
    }

    const btnUpload = frontCoverCard.querySelector('#btn-upload-custom-front');
    if (btnUpload && customFrontCoverInput) {
      btnUpload.addEventListener('click', () => customFrontCoverInput.click());
    }

    const btnReset = frontCoverCard.querySelector('#btn-reset-front-cover');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        resetCoverToGenerated('front');
        showToast('เปลี่ยนกลับมาใช้ปกหน้าอัตโนมัติแล้ว', 'info');
      });
    }

    updateCoverWatermarkOverlay('front', state);
  }

  // Render Back Cover Card
  async function renderBackCover(state, totalPages) {
    if (!backCoverCard) return;
    const back = state.backCover || {};
    const template = getCoverTemplate(back.templateId);
    const isCustom = back.mode === 'custom' && back.customPreviewUrl;
    const isLandscape = state.pdfSettings?.orientation === 'landscape';
    const finalPageText = totalPages ? `หน้า ${totalPages} (หน้าสุดท้าย)` : 'หน้าสุดท้าย';

    // Unique render cache key
    const renderKey = `${back.templateId}|${state.pdfSettings?.orientation}|${totalPages}`;

    let coverImageSrc = back.customPreviewUrl;

    if (!isCustom) {
      if (renderKey !== lastBackRenderKey || !cachedBackCoverDataUrl) {
        lastBackRenderKey = renderKey;
        try {
          cachedBackCoverDataUrl = await generateCoverDataUrl({
            type: 'back',
            templateId: back.templateId,
            student: state.student,
            orientation: state.pdfSettings?.orientation || 'portrait'
          });
        } catch (err) {
          console.error('Back cover generation error:', err);
        }
      }
      coverImageSrc = cachedBackCoverDataUrl;
    }

    backCoverCard.innerHTML = `
      <div class="card-header locked-header">
        <span class="badge badge-locked" title="หน้านี้ถูกล็อคให้อยู่หน้าสุดท้ายเสมอ">
          <span class="icon-inline" aria-hidden="true">${icons.lock}</span> ${finalPageText}
        </span>
        <span class="cover-type-label">ปกหลัง</span>
        ${isCustom ? `
          <span class="cover-custom-badge">ปกที่อัปโหลดเอง</span>
        ` : `
          <span class="cover-template-badge">${template.shortName || template.name}</span>
        `}
      </div>
      <p class="cover-description">ปกหลังจะอยู่หน้าสุดท้ายเสมอ</p>
      <div class="cover-card-body">
        <div class="cover-preview-canvas-wrap ${isLandscape ? 'is-landscape' : ''}">
          <img
            src="${coverImageSrc || './assets/branding/ban-wangwon-logo.png'}"
            alt="ตัวอย่างปกหลัง Portfolio"
            class="cover-preview-rendered-img"
            id="back-cover-rendered-img"
          />
        </div>
      </div>
      <div class="card-footer locked-footer">
        <div class="cover-card-actions">
          <button type="button" class="cover-action-btn btn-view-cover-modal" id="btn-view-large-back" aria-label="ดูปกหลังขนาดใหญ่">
            ${icons.eye} ดูปกขนาดใหญ่
          </button>
          <button type="button" class="cover-action-btn btn-upload-cover" id="btn-upload-custom-back" aria-label="อัปโหลดปกหลังเอง">
            ${icons.upload} อัปโหลดปกเอง
          </button>
          ${isCustom ? `
            <button type="button" class="cover-action-btn btn-reset-cover" id="btn-reset-back-cover" aria-label="กลับไปใช้ปกหลังอัตโนมัติ">
              ${icons.refreshCw} ใช้ปกอัตโนมัติ
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Button event listeners
    const btnViewLarge = backCoverCard.querySelector('#btn-view-large-back');
    if (btnViewLarge) {
      btnViewLarge.addEventListener('click', () => openCoverPreview('back'));
    }

    const btnUpload = backCoverCard.querySelector('#btn-upload-custom-back');
    if (btnUpload && customBackCoverInput) {
      btnUpload.addEventListener('click', () => customBackCoverInput.click());
    }

    const btnReset = backCoverCard.querySelector('#btn-reset-back-cover');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        resetCoverToGenerated('back');
        showToast('เปลี่ยนกลับมาใช้ปกหลังอัตโนมัติแล้ว', 'info');
      });
    }

    updateCoverWatermarkOverlay('back', state);
  }

  // Wire up Phase 5 Interactive Modals and Actions
  const deleteImageModal = document.querySelector('#delete-image-modal');
  const btnConfirmDeleteImage = document.querySelector('#btn-confirm-delete-image');
  const deleteImageModalFilename = document.querySelector('#delete-image-modal-filename');

  const imagePreviewModal = document.querySelector('#image-preview-modal');
  const imagePreviewTitle = document.querySelector('#image-preview-modal-title');
  const imagePreviewPageBadge = document.querySelector('#image-preview-page-badge');
  const imagePreviewImg = document.querySelector('#image-preview-img');
  const btnPreviewPrev = document.querySelector('#btn-preview-prev');
  const btnPreviewNext = document.querySelector('#btn-preview-next');
  const imagePreviewDims = document.querySelector('#image-preview-dims');
  const imagePreviewFilesize = document.querySelector('#image-preview-filesize');
  const imagePreviewLowresBadge = document.querySelector('#image-preview-lowres-badge');

  const imageDetailsModal = document.querySelector('#image-details-modal');
  const detailsFilename = document.querySelector('#details-filename');
  const detailsMimetype = document.querySelector('#details-mimetype');
  const detailsDimensions = document.querySelector('#details-dimensions');
  const detailsFilesize = document.querySelector('#details-filesize');
  const detailsRotation = document.querySelector('#details-rotation');
  const detailsQuality = document.querySelector('#details-quality');

  const replaceImageInput = document.querySelector('#replace-image-input');

  let pendingDeleteId = null;
  let pendingDeleteTrigger = null;
  let pendingReplaceId = null;
  let activePreviewIndex = -1;

  // 1. Delete Confirmation Modal Wiring
  document.addEventListener('wangwon:delete-image', (e) => {
    const { image, triggerButton } = e.detail;
    pendingDeleteId = image.id;
    pendingDeleteTrigger = triggerButton;
    if (deleteImageModal) {
      deleteImageModal.dataset.pendingId = image.id;
    }
    if (deleteImageModalFilename) {
      deleteImageModalFilename.textContent = `ไฟล์: ${image.originalFilename}`;
    }
    if (deleteImageModal) {
      openModal(deleteImageModal, triggerButton);
    }
  });

  if (btnConfirmDeleteImage && deleteImageModal) {
    btnConfirmDeleteImage.addEventListener('click', (e) => {
      e.stopPropagation();
      const idToDelete = pendingDeleteId || deleteImageModal.dataset.pendingId;
      pendingDeleteId = null;
      pendingDeleteTrigger = null;
      delete deleteImageModal.dataset.pendingId;

      closeModal(deleteImageModal);

      if (idToDelete) {
        const removed = removeStudentImage(idToDelete);
        if (removed) {
          showToast('ลบรูปภาพเรียบร้อยแล้ว', 'info');
        }
      }
    });
  }

  // 2. Lightbox Preview Modal Wiring
  function updateLightboxContent(index) {
    const state = projectStore.getState();
    const images = state.images || [];
    if (index < 0 || index >= images.length) return;

    activePreviewIndex = index;
    const img = images[index];
    const pageNum = index + 2;

    if (imagePreviewTitle) imagePreviewTitle.textContent = img.originalFilename;
    if (imagePreviewPageBadge) imagePreviewPageBadge.textContent = `หน้า ${pageNum}`;
    if (imagePreviewImg) {
      imagePreviewImg.src = img.previewUrl;
      imagePreviewImg.alt = `หน้า ${pageNum} - ${img.originalFilename}`;
      imagePreviewImg.style.transform = `rotate(${img.rotation || 0}deg)`;
    }

    if (imagePreviewDims) {
      imagePreviewDims.textContent = `${img.width} × ${img.height} px`;
    }
    if (imagePreviewFilesize) {
      const kb = (img.sizeBytes / 1024).toFixed(1);
      const mb = (img.sizeBytes / (1024 * 1024)).toFixed(2);
      imagePreviewFilesize.textContent = img.sizeBytes >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    }
    if (imagePreviewLowresBadge) {
      imagePreviewLowresBadge.style.display = img.qualityStatus === 'low' ? 'inline-flex' : 'none';
    }

    if (btnPreviewPrev) {
      btnPreviewPrev.disabled = index === 0;
      btnPreviewPrev.style.opacity = index === 0 ? '0.4' : '1';
    }
    if (btnPreviewNext) {
      btnPreviewNext.disabled = index === images.length - 1;
      btnPreviewNext.style.opacity = index === images.length - 1 ? '0.4' : '1';
    }
  }

  workspaceElement.addEventListener('wangwon:view-large', (e) => {
    const { index, triggerButton } = e.detail;
    updateLightboxContent(index);
    if (imagePreviewModal) {
      openModal(imagePreviewModal, triggerButton);
    }
  });

  if (btnPreviewPrev) {
    btnPreviewPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePreviewIndex > 0) {
        updateLightboxContent(activePreviewIndex - 1);
      }
    });
  }

  if (btnPreviewNext) {
    btnPreviewNext.addEventListener('click', (e) => {
      e.stopPropagation();
      const state = projectStore.getState();
      if (activePreviewIndex < (state.images?.length || 0) - 1) {
        updateLightboxContent(activePreviewIndex + 1);
      }
    });
  }

  // Keyboard navigation for Lightbox (ArrowLeft / ArrowRight)
  window.addEventListener('keydown', (e) => {
    if (!imagePreviewModal || !imagePreviewModal.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft' && activePreviewIndex > 0) {
      e.preventDefault();
      updateLightboxContent(activePreviewIndex - 1);
    } else if (e.key === 'ArrowRight') {
      const state = projectStore.getState();
      if (activePreviewIndex < (state.images?.length || 0) - 1) {
        e.preventDefault();
        updateLightboxContent(activePreviewIndex + 1);
      }
    }
  });

  // 3. Image Details Modal Wiring
  workspaceElement.addEventListener('wangwon:show-details', (e) => {
    const { image, triggerButton } = e.detail;
    if (detailsFilename) detailsFilename.textContent = image.originalFilename;
    if (detailsMimetype) detailsMimetype.textContent = image.mimeType || 'image/jpeg';
    if (detailsDimensions) detailsDimensions.textContent = `${image.width} × ${image.height} พิกเซล`;
    if (detailsFilesize) {
      const kb = (image.sizeBytes / 1024).toFixed(1);
      const mb = (image.sizeBytes / (1024 * 1024)).toFixed(2);
      detailsFilesize.textContent = image.sizeBytes >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    }
    if (detailsRotation) detailsRotation.textContent = `${image.rotation || 0}°`;
    if (detailsQuality) {
      if (image.qualityStatus === 'low') {
        detailsQuality.innerHTML = '<span style="color: var(--color-warning);">⚠️ ความละเอียดต่ำกว่าเกณฑ์</span>';
      } else {
        detailsQuality.innerHTML = '<span style="color: var(--color-success);">✓ คมชัด เหมาะสมกับการพิมพ์</span>';
      }
    }
    if (imageDetailsModal) {
      openModal(imageDetailsModal, triggerButton);
    }
  });

  // 4. Image Replacement Input Wiring
  workspaceElement.addEventListener('wangwon:replace-image', (e) => {
    const { image } = e.detail;
    pendingReplaceId = image.id;
    if (replaceImageInput) {
      replaceImageInput.value = '';
      replaceImageInput.click();
    }
  });

  if (replaceImageInput) {
    replaceImageInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file || !pendingReplaceId) return;

      const currentTargetId = pendingReplaceId;
      pendingReplaceId = null;

      try {
        const { replaceStudentImage } = await import('../portfolio/image-manager.js');
        const res = await replaceStudentImage(currentTargetId, file);
        if (res.success) {
          showToast('แทนที่รูปภาพเรียบร้อยแล้ว', 'success');
        } else {
          showToast(res.error || 'ไม่สามารถแทนที่รูปภาพได้', 'danger');
        }
      } catch (err) {
        console.error('Failed to replace image:', err);
        showToast('เกิดข้อผิดพลาดในการแทนที่รูปภาพ', 'danger');
      }
    });
  }

  // 5. Drag-and-drop Reordering on Student Image Cards Container
  if (studentImagesContainer) {
    studentImagesContainer.addEventListener('dragover', (e) => {
      if (!window.__WANGWON_DRAGGING_ID__) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const targetCard = e.target.closest('.student-image-card');
      if (!targetCard || targetCard.dataset.id === window.__WANGWON_DRAGGING_ID__) {
        return;
      }

      const rect = targetCard.getBoundingClientRect();
      const isAfterMid = (e.clientX - rect.left) > rect.width / 2;

      document.querySelectorAll('.student-image-card').forEach((c) => {
        c.classList.remove('is-dragover-left', 'is-dragover-right');
      });

      if (isAfterMid) {
        targetCard.classList.add('is-dragover-right');
      } else {
        targetCard.classList.add('is-dragover-left');
      }
    });

    studentImagesContainer.addEventListener('dragleave', (e) => {
      if (!window.__WANGWON_DRAGGING_ID__) return;
      const targetCard = e.target.closest('.student-image-card');
      if (targetCard && !targetCard.contains(e.relatedTarget)) {
        targetCard.classList.remove('is-dragover-left', 'is-dragover-right');
      }
    });

    studentImagesContainer.addEventListener('drop', async (e) => {
      const draggedId = window.__WANGWON_DRAGGING_ID__;
      if (!draggedId) return;

      e.preventDefault();
      e.stopPropagation();

      const targetCard = e.target.closest('.student-image-card');
      document.querySelectorAll('.student-image-card').forEach((c) => {
        c.classList.remove('is-dragover-left', 'is-dragover-right');
      });

      if (!targetCard || targetCard.dataset.id === draggedId) return;

      const state = projectStore.getState();
      const images = state.images || [];
      const oldIndex = images.findIndex((img) => img.id === draggedId);
      const targetIndex = images.findIndex((img) => img.id === targetCard.dataset.id);

      if (oldIndex === -1 || targetIndex === -1) return;

      const rect = targetCard.getBoundingClientRect();
      const isAfterMid = (e.clientX - rect.left) > rect.width / 2;
      let newIndex = isAfterMid ? targetIndex + 1 : targetIndex;
      if (oldIndex < newIndex) {
        newIndex -= 1;
      }

      if (oldIndex !== newIndex) {
        const { reorderImageByIndex } = await import('../portfolio/image-manager.js');
        reorderImageByIndex(oldIndex, newIndex);
        showToast('จัดลำดับหน้าเรียบร้อยแล้ว', 'info');
      }
    });
  }

  // Render Middle Student Images
  function renderStudentImages(images) {
    if (!studentImagesContainer) return;

    studentImagesContainer.innerHTML = '';

    if (!images || images.length === 0) {
      if (emptyPlaceholder) emptyPlaceholder.style.display = 'flex';
      return;
    }

    if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';

    // Render individual image cards
    images.forEach((img, idx) => {
      const card = createImageCard(img, idx + 1, images.length);
      studentImagesContainer.appendChild(card);
    });

    // Render compact "Add Page" card inside grid before back cover
    const addPageCard = document.createElement('div');
    addPageCard.id = 'compact-add-page-card';
    addPageCard.className = 'portfolio-card compact-add-page-card';
    addPageCard.setAttribute('role', 'button');
    addPageCard.setAttribute('tabindex', '0');
    addPageCard.setAttribute('aria-label', 'เพิ่มรูปภาพและหน้าผลงาน');
    addPageCard.innerHTML = `
      <div class="compact-add-inner">
        <div class="compact-add-icon" aria-hidden="true">${icons.plus}</div>
        <div class="compact-add-title">เพิ่มรูปภาพ</div>
        <div class="compact-add-subtitle">ลากรูปมาวาง หรือคลิกเพื่อเลือก</div>
      </div>
    `;

    addPageCard.addEventListener('click', () => {
      if (addImagesInput) addImagesInput.click();
    });

    addPageCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (addImagesInput) addImagesInput.click();
      }
    });

    studentImagesContainer.appendChild(addPageCard);
    updateActivityWatermarkOverlays(projectStore.getState());
  }

  function updateCoverWatermarkOverlay(type, state) {
    const card = type === 'front' ? frontCoverCard : backCoverCard;
    if (!card) return;
    const wm = state?.watermark;
    const wrap = card.querySelector('.cover-preview-canvas-wrap');
    if (!wrap) return;

    let overlay = wrap.querySelector('.watermark-overlay');
    const pageType = type === 'front' ? 'front-cover' : 'back-cover';
    const src = getWatermarkImageSrc(wm);
    const shouldShow = !!(wm && wm.enabled && wm.sourceType !== 'none' && src && shouldApplyWatermark(wm.applyTo, pageType));

    if (!shouldShow) {
      if (overlay) overlay.remove();
      return;
    }

    if (!overlay) {
      overlay = document.createElement('img');
      overlay.className = 'watermark-overlay';
      overlay.alt = '';
      overlay.setAttribute('aria-hidden', 'true');
      wrap.appendChild(overlay);
    }

    const w = wrap.clientWidth || 210;
    const h = wrap.clientHeight || 297;
    const style = getWatermarkCssOverlayStyle(wm, w, h);
    Object.assign(overlay.style, style);
    if (overlay.src !== src) {
      overlay.src = src;
    }
  }

  function updateActivityWatermarkOverlays(state) {
    if (!studentImagesContainer) return;
    const wm = state?.watermark;
    const src = getWatermarkImageSrc(wm);
    const shouldShow = !!(wm && wm.enabled && wm.sourceType !== 'none' && src && shouldApplyWatermark(wm.applyTo, 'activity'));
    const cards = studentImagesContainer.querySelectorAll('.student-image-card');

    cards.forEach((card) => {
      const preview = card.querySelector('.card-preview');
      if (!preview) return;
      let overlay = preview.querySelector('.watermark-overlay');

      if (!shouldShow) {
        if (overlay) overlay.remove();
        return;
      }

      if (!overlay) {
        overlay = document.createElement('img');
        overlay.className = 'watermark-overlay';
        overlay.alt = '';
        overlay.setAttribute('aria-hidden', 'true');
        preview.appendChild(overlay);
      }

      const w = preview.clientWidth || 220;
      const h = preview.clientHeight || 220;
      const style = getWatermarkCssOverlayStyle(wm, w, h);
      Object.assign(overlay.style, style);
      if (overlay.src !== src) {
        overlay.src = src;
      }
    });
  }

  function updateAllWatermarkOverlays(state) {
    const s = state || projectStore.getState();
    updateCoverWatermarkOverlay('front', s);
    updateCoverWatermarkOverlay('back', s);
    updateActivityWatermarkOverlays(s);
  }

  // Subscribe to state updates
  projectStore.subscribe((state) => {
    const images = state.images || [];
    const totalPages = images.length + 2;

    renderFrontCover(state);
    renderStudentImages(images);
    renderBackCover(state, totalPages);
    updateAllWatermarkOverlays(state);

    if (imageCountBadge) {
      imageCountBadge.textContent = `${images.length} ภาพผลงาน`;
    }
    if (totalPagesBadge) {
      totalPagesBadge.textContent = `${totalPages} หน้า รวมปกหน้าและปกหลัง`;
    }
  });

  window.addEventListener('resize', () => {
    updateAllWatermarkOverlays(projectStore.getState());
  });

  // Initial render
  const initialState = projectStore.getState();
  renderFrontCover(initialState);
  renderStudentImages(initialState.images);
  renderBackCover(initialState, (initialState.images?.length || 0) + 2);
  updateAllWatermarkOverlays(initialState);
}
