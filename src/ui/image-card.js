/**
 * Image Card UI Component
 * Renders individual student activity/work image with preview, rotation, and removal controls.
 */
import { rotateStudentImage, removeStudentImage } from '../portfolio/image-manager.js';

/**
 * Creates a DOM element for a student image item.
 *
 * @param {object} image - Image item from state.images
 * @param {number} displayIndex - 1-based index
 * @returns {HTMLElement}
 */
export function createImageCard(image, displayIndex) {
  const card = document.createElement('div');
  card.className = 'portfolio-card student-image-card';
  card.dataset.id = image.id;
  card.setAttribute('role', 'listitem');
  card.setAttribute('aria-label', `รูปผลงานที่ ${displayIndex}: ${image.originalFilename}`);

  card.innerHTML = `
    <div class="card-header">
      <span class="badge page-badge">หน้าที่ ${displayIndex + 1}</span>
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
    <div class="card-actions">
      <button
        type="button"
        class="btn-icon btn-rotate"
        title="หมุนตามเข็มนาฬิกา 90°"
        aria-label="หมุนรูปภาพที่ ${displayIndex} 90 องศา"
      >
        <span aria-hidden="true">↻</span>
        <span class="btn-text">หมุน</span>
      </button>
      <button
        type="button"
        class="btn-icon btn-delete"
        title="ลบรูปนี้"
        aria-label="ลบรูปภาพที่ ${displayIndex}"
      >
        <span aria-hidden="true">✕</span>
        <span class="btn-text">ลบ</span>
      </button>
    </div>
  `;

  // Attach button events
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
