/**
 * Wangwon Portfolio - Document Preview Controller (Section 3)
 * Provides real-time interactive preview of the document:
 * Page 1: Front Cover
 * Page 2..(N+1): Activity Images (with rotation, fit/fill, watermark)
 * Page N+2: Back Cover
 *
 * Lightweight screen-resolution canvas rendering (800-1200px width),
 * responsive thumbnail strip, page navigation, and instant reactive updates
 * when settings change without page jumping.
 */
import { projectStore } from '../portfolio/portfolio-state.js';
import { generateCoverCanvas } from '../portfolio/cover-generator.js';
import { renderActivityPageCanvas, renderCoverPageCanvas, loadImageElement } from '../portfolio/page-renderer.js';
import { getWatermarkImageSrc } from '../portfolio/watermark-renderer.js';

let activePageIndex = 0; // 0-based: 0 = Front Cover, 1..N = images, N+1 = Back Cover
let previewCanvas = null;
let previewContainer = null;
let pageCounterText = null;
let btnPrev = null;
let btnNext = null;
let thumbnailStrip = null;
let currentRenderPromise = null;
let preloadedWatermarkImg = null;
let lastWatermarkSrc = '';

/**
 * Calculates page dimensions for screen preview (optimized, lightweight).
 * Base width 842px for portrait (roughly 100 DPI screen preview), or swapped for landscape.
 */
function getPreviewCanvasDimensions(orientation) {
  const isLandscape = orientation === 'landscape';
  const w = isLandscape ? 1191 : 842;
  const h = isLandscape ? 842 : 1191;
  return { width: w, height: h };
}

/**
 * Gets the total page count for current state: images.length + 2 (Front & Back covers).
 */
export function getTotalPreviewPages(state) {
  return (state.images?.length || 0) + 2;
}

export function getCurrentPreviewPageIndex() {
  return activePageIndex;
}

/**
 * Renders the active preview page onto the main canvas.
 */
export async function renderCurrentPreviewPage() {
  if (!previewCanvas) return;

  const state = projectStore.getState();
  const totalPages = getTotalPreviewPages(state);

  // Clamp activePageIndex within [0, totalPages - 1]
  if (activePageIndex >= totalPages) {
    activePageIndex = Math.max(0, totalPages - 1);
  }

  const orientation = state.pdfSettings?.orientation || 'portrait';
  const placement = state.pdfSettings?.placement || 'fit';
  const dims = getPreviewCanvasDimensions(orientation);

  // Update UI navigation controls
  updatePreviewNavUI(totalPages);

  // Preload watermark image if needed
  const wm = state.watermark;
  const wmSrc = getWatermarkImageSrc(wm);
  if (wm && wm.enabled && wm.sourceType !== 'none' && wmSrc) {
    if (wmSrc !== lastWatermarkSrc || !preloadedWatermarkImg) {
      try {
        preloadedWatermarkImg = await loadImageElement(wmSrc);
        lastWatermarkSrc = wmSrc;
      } catch (e) {
        console.warn('[DocPreview] Failed to load watermark preview image:', e);
        preloadedWatermarkImg = null;
      }
    }
  } else {
    preloadedWatermarkImg = null;
    lastWatermarkSrc = '';
  }

  const renderSeq = ++renderCounter;

  try {
    let renderedCanvas = null;

    if (activePageIndex === 0) {
      // Front Cover
      renderedCanvas = await renderCoverPageCanvas({
        type: 'front',
        coverState: state.frontCover,
        student: state.student,
        studentPhoto: state.studentPhoto,
        orientation,
        pageWidth: dims.width,
        pageHeight: dims.height,
        watermarkState: wm,
        watermarkImage: preloadedWatermarkImg
      });
    } else if (activePageIndex === totalPages - 1) {
      // Back Cover
      renderedCanvas = await renderCoverPageCanvas({
        type: 'back',
        coverState: state.backCover,
        student: state.student,
        studentPhoto: state.studentPhoto,
        orientation,
        pageWidth: dims.width,
        pageHeight: dims.height,
        watermarkState: wm,
        watermarkImage: preloadedWatermarkImg
      });
    } else {
      // Activity Image Page
      const imageIndex = activePageIndex - 1;
      const imageItem = state.images[imageIndex];

      renderedCanvas = await renderActivityPageCanvas({
        imageItem,
        pageWidth: dims.width,
        pageHeight: dims.height,
        placement,
        watermarkState: wm,
        watermarkImage: preloadedWatermarkImg
      });
    }

    // Ignore if another render was triggered in the meantime
    if (renderSeq !== renderCounter) return;

    if (renderedCanvas) {
      previewCanvas.width = dims.width;
      previewCanvas.height = dims.height;
      const ctx = previewCanvas.getContext('2d');
      ctx.clearRect(0, 0, dims.width, dims.height);
      ctx.drawImage(renderedCanvas, 0, 0);

      // Adjust CSS aspect ratio of canvas container
      if (previewCanvas.parentElement) {
        previewCanvas.parentElement.dataset.orientation = orientation;
      }
    }
  } catch (err) {
    console.error('[DocPreview] Render error on page', activePageIndex, err);
  }

  // Update thumbnail strip highlighting
  updateThumbnailStrip(totalPages);
}

let renderCounter = 0;

function updatePreviewNavUI(totalPages) {
  if (pageCounterText) {
    let pageLabel = '';
    if (activePageIndex === 0) {
      pageLabel = 'ปกหน้า (หน้า 1)';
    } else if (activePageIndex === totalPages - 1) {
      pageLabel = `ปกหลัง (หน้า ${totalPages})`;
    } else {
      pageLabel = `หน้าผลงาน ${activePageIndex} (หน้า ${activePageIndex + 1})`;
    }
    pageCounterText.textContent = `หน้า ${activePageIndex + 1} / ${totalPages} • ${pageLabel}`;
  }

  if (btnPrev) {
    btnPrev.disabled = activePageIndex <= 0;
    btnPrev.setAttribute('aria-disabled', String(activePageIndex <= 0));
  }

  if (btnNext) {
    btnNext.disabled = activePageIndex >= totalPages - 1;
    btnNext.setAttribute('aria-disabled', String(activePageIndex >= totalPages - 1));
  }
}

function updateThumbnailStrip(totalPages) {
  if (!thumbnailStrip) return;

  const buttons = thumbnailStrip.querySelectorAll('.preview-thumb-btn');
  buttons.forEach((btn, idx) => {
    const isActive = idx === activePageIndex;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Scroll active thumbnail into view smoothly
  const activeBtn = thumbnailStrip.querySelector(`.preview-thumb-btn[data-page="${activePageIndex}"]`);
  if (activeBtn) {
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

/**
 * Rebuilds the thumbnail button strip.
 */
export function buildThumbnailStrip() {
  if (!thumbnailStrip) return;

  const state = projectStore.getState();
  const totalPages = getTotalPreviewPages(state);

  thumbnailStrip.innerHTML = '';

  for (let i = 0; i < totalPages; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `preview-thumb-btn ${i === activePageIndex ? 'is-active' : ''}`;
    btn.dataset.page = String(i);

    let name = '';
    if (i === 0) name = 'ปกหน้า';
    else if (i === totalPages - 1) name = 'ปกหลัง';
    else name = `${i}`;

    btn.setAttribute('aria-label', `ไปยังหน้า ${i + 1} (${name})`);
    btn.innerHTML = `<span class="thumb-page-num">${i + 1}</span><span class="thumb-page-name">${name}</span>`;

    btn.addEventListener('click', () => {
      activePageIndex = i;
      renderCurrentPreviewPage();
    });

    thumbnailStrip.appendChild(btn);
  }
}

/**
 * Jump to previous page
 */
export function previewPrevPage() {
  if (activePageIndex > 0) {
    activePageIndex--;
    renderCurrentPreviewPage();
  }
}

/**
 * Jump to next page
 */
export function previewNextPage() {
  const state = projectStore.getState();
  const totalPages = getTotalPreviewPages(state);
  if (activePageIndex < totalPages - 1) {
    activePageIndex++;
    renderCurrentPreviewPage();
  }
}

/**
 * Initializes Document Preview inside Section 3
 */
export function initDocumentPreview(container) {
  if (!container) return;

  previewContainer = container;
  previewCanvas = container.querySelector('#document-preview-canvas');
  pageCounterText = container.querySelector('#preview-page-indicator');
  btnPrev = container.querySelector('#btn-preview-page-prev');
  btnNext = container.querySelector('#btn-preview-page-next');
  thumbnailStrip = container.querySelector('#preview-thumbnail-strip');

  if (btnPrev) {
    btnPrev.addEventListener('click', previewPrevPage);
  }

  if (btnNext) {
    btnNext.addEventListener('click', previewNextPage);
  }

  // Keyboard navigation when inside preview area
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      previewPrevPage();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      previewNextPage();
    }
  });

  // Rebuild thumbnail strip and render when state changes
  projectStore.subscribe((state) => {
    // Only perform full render if preview is visible or being shown
    const sec3 = document.querySelector('#section-review-export');
    if (sec3 && !sec3.hidden) {
      buildThumbnailStrip();
      renderCurrentPreviewPage();
    }
  });

  // Listen for section changed event to trigger initial render when entering Section 3
  window.addEventListener('wangwon:section-changed', (e) => {
    if (e.detail?.section === 3) {
      buildThumbnailStrip();
      renderCurrentPreviewPage();
    }
  });

  buildThumbnailStrip();
}
