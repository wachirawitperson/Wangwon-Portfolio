import {
  rotateStudentImage,
  removeStudentImage,
  moveImageEarlier,
  moveImageLater,
  duplicateStudentImage
} from '../portfolio/image-manager.js';
import { icons } from './icons.js';
import { showToast } from './notifications.js';

// Global document listener for closing context menus when clicking outside
let hasGlobalMenuListener = false;
function initGlobalMenuListener() {
  if (hasGlobalMenuListener) return;
  hasGlobalMenuListener = true;

  document.addEventListener('click', (e) => {
    const openMenus = document.querySelectorAll('.card-context-menu:not([hidden])');
    openMenus.forEach((menu) => {
      const card = menu.closest('.student-image-card');
      if (!card || !card.contains(e.target)) {
        menu.hidden = true;
        const btnMore = card?.querySelector('.btn-more');
        if (btnMore) btnMore.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openMenus = document.querySelectorAll('.card-context-menu:not([hidden])');
      openMenus.forEach((menu) => {
        menu.hidden = true;
        const card = menu.closest('.student-image-card');
        const btnMore = card?.querySelector('.btn-more');
        if (btnMore) {
          btnMore.setAttribute('aria-expanded', 'false');
          btnMore.focus();
        }
      });
    }
  });
}

/**
 * Creates a DOM element for a student image item.
 *
 * @param {object} image - Image item from state.images
 * @param {number} displayIndex - 1-based index (1 = Page 2)
 * @param {number} totalImages - Total count of activity images
 * @returns {HTMLElement}
 */
export function createImageCard(image, displayIndex, totalImages = 1) {
  initGlobalMenuListener();

  const card = document.createElement('div');
  const isLowRes = image.qualityStatus === 'low';
  card.className = `portfolio-card student-image-card ${isLowRes ? 'has-warning-lowres' : ''}`;
  card.dataset.id = image.id;
  card.dataset.index = String(displayIndex - 1);
  card.setAttribute('role', 'listitem');
  card.draggable = true;

  const pageNum = displayIndex + 1;
  const isFirst = displayIndex === 1;
  const isLast = displayIndex === totalImages;

  card.setAttribute('aria-label', `หน้า ${pageNum} รูป ${image.originalFilename}`);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-header-left">
        <span class="drag-handle" title="ลากเพื่อจัดลำดับหน้า ${pageNum}" aria-label="ลากเพื่อจัดลำดับหน้า ${pageNum}" tabindex="0">
          <span class="icon-svg" aria-hidden="true">${icons.gripVertical}</span>
        </span>
        <span class="badge page-badge" title="หน้า ${pageNum} ของเอกสาร">หน้า ${pageNum}</span>
      </div>
      <span class="image-name" title="${image.originalFilename}">${image.originalFilename}</span>
    </div>
    <div class="card-preview">
      <img
        src="${image.previewUrl}"
        alt="รูปกิจกรรม ${displayIndex}"
        style="transform: rotate(${image.rotation || 0}deg);"
        loading="lazy"
      />
    </div>
    ${isLowRes ? `
      <div class="warning-badge-area" role="alert" title="${image.qualityWarning || 'ภาพมีความละเอียดต่ำกว่าเกณฑ์มาตรฐาน'}">
        <span class="icon-inline" aria-hidden="true">${icons.alertTriangle}</span> ความละเอียดต่ำ (${image.width} × ${image.height})
      </div>
    ` : ''}
    <div class="card-actions quick-actions-toolbar" aria-label="คำสั่งด่วนสำหรับรูปภาพ">
      <button
        type="button"
        class="btn-icon btn-rotate"
        title="หมุนตามเข็มนาฬิกา 90°"
        aria-label="หมุนภาพ 90 องศา (หน้า ${pageNum})"
      >
        <span class="icon-svg" aria-hidden="true">${icons.rotateCw}</span>
        <span class="btn-text">หมุน</span>
      </button>
      <button
        type="button"
        class="btn-icon btn-delete"
        title="ลบรูปนี้"
        aria-label="ลบรูปภาพหน้า ${pageNum}"
      >
        <span class="icon-svg" aria-hidden="true">${icons.trash2}</span>
        <span class="btn-text">ลบ</span>
      </button>
      <button
        type="button"
        class="btn-icon btn-more"
        title="ตัวเลือกเพิ่มเติม"
        aria-label="ตัวเลือกเพิ่มเติมของหน้า ${pageNum}"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span class="icon-svg" aria-hidden="true">${icons.moreVertical}</span>
      </button>
    </div>

    <!-- Contextual More Menu -->
    <div class="card-context-menu" role="menu" aria-label="เมนูจัดการรูปภาพหน้า ${pageNum}" hidden>
      <button type="button" class="menu-item" role="menuitem" data-action="rotate">
        <span class="menu-icon" aria-hidden="true">${icons.rotateCw}</span>
        <span>หมุนภาพ 90°</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" data-action="view-large">
        <span class="menu-icon" aria-hidden="true">${icons.maximize2}</span>
        <span>ดูรูปขนาดใหญ่</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" data-action="replace">
        <span class="menu-icon" aria-hidden="true">${icons.refreshCw}</span>
        <span>แทนที่รูป</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" data-action="duplicate">
        <span class="menu-icon" aria-hidden="true">${icons.copy}</span>
        <span>ทำสำเนา</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" data-action="move-earlier" ${isFirst ? 'disabled aria-disabled="true"' : ''}>
        <span class="menu-icon" aria-hidden="true">${icons.arrowLeft}</span>
        <span>ย้ายไปก่อน</span>
      </button>
      <button type="button" class="menu-item" role="menuitem" data-action="move-later" ${isLast ? 'disabled aria-disabled="true"' : ''}>
        <span class="menu-icon" aria-hidden="true">${icons.arrowRight}</span>
        <span>ย้ายไปถัดไป</span>
      </button>
      <div class="menu-divider" role="separator" aria-hidden="true"></div>
      <button type="button" class="menu-item" role="menuitem" data-action="details">
        <span class="menu-icon" aria-hidden="true">${icons.info}</span>
        <span>ดูรายละเอียดรูป</span>
      </button>
      <button type="button" class="menu-item menu-item-danger" role="menuitem" data-action="delete">
        <span class="menu-icon" aria-hidden="true">${icons.trash2}</span>
        <span>ลบรูปภาพ</span>
      </button>
    </div>
  `;

  // Rotate quick action handler
  const rotateBtn = card.querySelector('.btn-rotate');
  rotateBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    rotateStudentImage(image.id);
  });

  // Delete quick action handler (triggers confirmation modal via event)
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    card.dispatchEvent(
      new CustomEvent('wangwon:delete-image', {
        bubbles: true,
        detail: { image, triggerButton: deleteBtn }
      })
    );
  });

  // More menu toggling
  const btnMore = card.querySelector('.btn-more');
  const contextMenu = card.querySelector('.card-context-menu');

  btnMore.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCurrentlyOpen = !contextMenu.hidden;

    // Close any other open menus
    document.querySelectorAll('.card-context-menu:not([hidden])').forEach((m) => {
      m.hidden = true;
      const b = m.closest('.student-image-card')?.querySelector('.btn-more');
      if (b) b.setAttribute('aria-expanded', 'false');
    });

    if (!isCurrentlyOpen) {
      contextMenu.hidden = false;
      btnMore.setAttribute('aria-expanded', 'true');
      // Focus first available item
      const firstItem = contextMenu.querySelector('.menu-item:not([disabled])');
      firstItem?.focus();
    }
  });

  // Context Menu Item Actions
  contextMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (!item || item.hasAttribute('disabled')) return;

    e.stopPropagation();
    contextMenu.hidden = true;
    btnMore.setAttribute('aria-expanded', 'false');

    const action = item.dataset.action;
    switch (action) {
      case 'rotate':
        rotateStudentImage(image.id);
        break;

      case 'delete':
        card.dispatchEvent(
          new CustomEvent('wangwon:delete-image', {
            bubbles: true,
            detail: { image, triggerButton: btnMore }
          })
        );
        break;

      case 'view-large':
        card.dispatchEvent(
          new CustomEvent('wangwon:view-large', {
            bubbles: true,
            detail: { image, index: displayIndex - 1, triggerButton: btnMore }
          })
        );
        break;

      case 'replace':
        card.dispatchEvent(
          new CustomEvent('wangwon:replace-image', {
            bubbles: true,
            detail: { image, triggerButton: btnMore }
          })
        );
        break;

      case 'duplicate':
        duplicateStudentImage(image.id);
        showToast('ทำสำเนารูปภาพเรียบร้อย', 'success');
        break;

      case 'move-earlier':
        moveImageEarlier(image.id);
        showToast('ย้ายรูปภาพไปก่อนหน้าแล้ว', 'info');
        break;

      case 'move-later':
        moveImageLater(image.id);
        showToast('ย้ายรูปภาพไปถัดไปแล้ว', 'info');
        break;

      case 'details':
        card.dispatchEvent(
          new CustomEvent('wangwon:show-details', {
            bubbles: true,
            detail: { image, triggerButton: btnMore }
          })
        );
        break;
    }
  });

  // Tap image thumbnail to view large preview
  const previewArea = card.querySelector('.card-preview');
  if (previewArea) {
    previewArea.addEventListener('click', (e) => {
      // If clicking inside menu or buttons, ignore
      if (e.target.closest('button') || e.target.closest('.card-context-menu')) return;
      card.dispatchEvent(
        new CustomEvent('wangwon:view-large', {
          bubbles: true,
          detail: { image, index: displayIndex - 1, triggerButton: previewArea }
        })
      );
    });
  }

  // HTML5 Drag Events on Card
  card.addEventListener('dragstart', (e) => {
    // Only drag if originating from card or handle, not from button/menu
    if (e.target.closest('button') || e.target.closest('.card-context-menu')) {
      e.preventDefault();
      return;
    }

    window.__WANGWON_DRAGGING_ID__ = image.id;
    card.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-wangwon-image', image.id);
    e.dataTransfer.setData('text/plain', image.id);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('is-dragging');
    window.__WANGWON_DRAGGING_ID__ = null;
    document.querySelectorAll('.student-image-card').forEach((c) => {
      c.classList.remove('is-dragover-left', 'is-dragover-right');
    });
  });

  return card;
}
