/**
 * Portfolio Workspace Component
 * Orchestrates the visual sequence:
 * [Locked Front Cover (Page 1)] -> [Student Images List] -> [Add Images Action] -> [Locked Back Cover (Last Page)]
 */
import { projectStore } from '../portfolio/portfolio-state.js';
import { addStudentImages } from '../portfolio/image-manager.js';
import { createImageCard } from './image-card.js';
import { COVER_TEMPLATES, getCoverTemplate } from '../portfolio/cover-manager.js';
import { showToast } from './notifications.js';

export function initWorkspace(workspaceElement) {
  if (!workspaceElement) return;

  const frontCoverCard = workspaceElement.querySelector('#front-cover-card');
  const studentImagesContainer = workspaceElement.querySelector('#student-images-container');
  const emptyPlaceholder = workspaceElement.querySelector('#images-empty-placeholder');
  const addImagesInput = workspaceElement.querySelector('#file-upload-input');
  const addImagesBtn = workspaceElement.querySelector('#btn-add-images');
  const backCoverCard = workspaceElement.querySelector('#back-cover-card');
  const totalPagesBadge = document.querySelector('#total-pages-badge');

  // Trigger file selection
  if (addImagesBtn && addImagesInput) {
    addImagesBtn.addEventListener('click', () => {
      addImagesInput.click();
    });

    addImagesInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        addStudentImages(files);
        showToast(`เพิ่มรูปภาพสำเร็จ ${files.length} รูป`, 'success');
        addImagesInput.value = ''; // Reset input for repeated selections
      }
    });
  }

  // Render Front Cover Card
  function renderFrontCover(state) {
    if (!frontCoverCard) return;
    const template = getCoverTemplate(state.frontCover.templateId);
    const student = state.student || {};
    const fullName = `${student.prefix || ''}${student.firstName || ''} ${student.lastName || ''}`.trim() || 'ชื่อ-นามสกุล นักเรียน';

    frontCoverCard.innerHTML = `
      <div class="card-header locked-header">
        <span class="badge locked-badge" title="หน้านี้ถูกล็อคให้อยู่หน้าแรกเสมอ">
          <span aria-hidden="true">🔒</span> หน้า 1: ปกหน้า (ล็อค)
        </span>
        <span class="template-name">${template.name}</span>
      </div>
      <div class="cover-card-body">
        <div class="cover-visual-preview cover-front-theme" style="--accent: ${template.accentColor}">
          <div class="cover-inner-content">
            <div class="cover-school-tag">โรงเรียนบ้านวังวน</div>
            <h3 class="cover-title">แฟ้มสะสมผลงาน</h3>
            <div class="cover-student-name">${fullName}</div>
            <div class="cover-student-sub">${student.grade || 'ระดับชั้น'} | เลขที่ ${student.studentNumber || '-'}</div>
            <div class="cover-year">ปีการศึกษา ${student.academicYear || '2567'}</div>
          </div>
        </div>
      </div>
      <div class="card-footer locked-footer">
        <div class="template-selector-wrapper">
          <label for="front-template-select" class="sr-only">เลือกรูปแบบปกหน้า</label>
          <select id="front-template-select" class="form-select select-sm" aria-label="เลือกรูปแบบปกหน้า">
            ${COVER_TEMPLATES.map(
              (t) => `<option value="${t.id}" ${t.id === state.frontCover.templateId ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    `;

    const select = frontCoverCard.querySelector('#front-template-select');
    if (select) {
      select.addEventListener('change', (e) => {
        projectStore.setState({
          frontCover: {
            ...state.frontCover,
            templateId: e.target.value
          }
        });
      });
    }
  }

  // Render Back Cover Card
  function renderBackCover(state, totalPages) {
    if (!backCoverCard) return;
    const template = getCoverTemplate(state.backCover.templateId);

    backCoverCard.innerHTML = `
      <div class="card-header locked-header">
        <span class="badge locked-badge" title="หน้านี้ถูกล็อคให้อยู่หน้าสุดท้ายเสมอ">
          <span aria-hidden="true">🔒</span> หน้า ${totalPages}: ปกหลัง (ล็อค)
        </span>
        <span class="template-name">${template.name}</span>
      </div>
      <div class="cover-card-body">
        <div class="cover-visual-preview cover-back-theme" style="--accent: ${template.accentColor}">
          <div class="cover-inner-content">
            <div class="back-cover-motto">"เรียนดี มีวินัย ใฝ่เรียนรู้ สู่คุณธรรม"</div>
            <div class="back-school-info">
              <div>โรงเรียนบ้านวังวน</div>
              <small>สำนักงานเขตพื้นที่การศึกษาประถมศึกษา</small>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer locked-footer">
        <div class="template-selector-wrapper">
          <label for="back-template-select" class="sr-only">เลือกรูปแบบปกหลัง</label>
          <select id="back-template-select" class="form-select select-sm" aria-label="เลือกรูปแบบปกหลัง">
            ${COVER_TEMPLATES.map(
              (t) => `<option value="${t.id}" ${t.id === state.backCover.templateId ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    `;

    const select = backCoverCard.querySelector('#back-template-select');
    if (select) {
      select.addEventListener('change', (e) => {
        projectStore.setState({
          backCover: {
            ...state.backCover,
            templateId: e.target.value
          }
        });
      });
    }
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

    images.forEach((img, idx) => {
      const card = createImageCard(img, idx + 1);
      studentImagesContainer.appendChild(card);
    });
  }

  // Subscribe to state updates
  projectStore.subscribe((state) => {
    const images = state.images || [];
    const totalPages = images.length + 2; // Front + Images + Back

    renderFrontCover(state);
    renderStudentImages(images);
    renderBackCover(state, totalPages);

    if (totalPagesBadge) {
      totalPagesBadge.textContent = `${totalPages} หน้า (ปกหน้า 1 + ผลงาน ${images.length} + ปกหลัง 1)`;
    }
  });

  // Initial render
  const initialState = projectStore.getState();
  renderFrontCover(initialState);
  renderStudentImages(initialState.images);
  renderBackCover(initialState, (initialState.images?.length || 0) + 2);
}
