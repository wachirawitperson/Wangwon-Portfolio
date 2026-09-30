import { rotateStudentImage, removeStudentImage } from '../portfolio/image-manager.js';
import { icons } from './icons.js';

/**
 * Creates a DOM element for a student image item.
 *
 * @param {object} image - Image item from state.images
 * @param {number} displayIndex - 1-based index
 * @returns {HTMLElement}
 */
export function createImageCard(image, displayIndex) {
  const card = document.createElement('div');
  const isLowRes = image.qualityStatus === 'low';
  card.className = `portfolio-card student-image-card ${isLowRes ? 'has-warning-lowres' : ''}`;
  card.dataset.id = image.id;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `รูปผลงานที่ ${displayIndex}: ${image.originalFilename}`);

  const pageNum = displayIndex + 1;

  card.innerHTML = `
    <div class="card-header">
      <span class="badge page-badge" title="หน้า ${pageNum} ของเอกสาร">หน้า ${pageNum}</span>
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
        aria-label="หมุนภาพ"
      >
        <span class="icon-svg" aria-hidden="true">${icons.rotateCw}</span>
        <span class="btn-text">หมุน</span>
      </button>
      <button
        type="button"
        class="btn-icon btn-delete"
        title="ลบรูปนี้"
        aria-label="ลบรูป"
      >
        <span class="icon-svg" aria-hidden="true">${icons.trash2}</span>
        <span class="btn-text">ลบ</span>
      </button>
      <button
        type="button"
        class="btn-icon btn-more"
        title="ตัวเลือกเพิ่มเติม"
        aria-label="เมนูเพิ่มเติม"
      >
        <span class="icon-svg" aria-hidden="true">${icons.moreVertical}</span>
      </button>
    </div>
  `;

  // Attach button events (Quick action handlers)
  const rotateBtn = card.querySelector('.btn-rotate');
  rotateBtn.addEventListener('click', () => {
    rotateStudentImage(image.id);
  });

  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => {
    removeStudentImage(image.id);
  });

  return card;
}
