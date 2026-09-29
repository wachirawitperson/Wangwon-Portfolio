/**
 * Portfolio Workspace Component (Phase 2 Design System)
 * Orchestrates the visual sequence:
 * [Locked Front Cover (Page 1)] -> [Empty Image State / Student Images] -> [Locked Back Cover (Last Page)]
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
  const addImagesEmptyBtn = workspaceElement.querySelector('#btn-empty-add-images');
  const backCoverCard = workspaceElement.querySelector('#back-cover-card');
  const totalPagesBadge = document.querySelector('#total-pages-badge');
  const imageCountBadge = document.querySelector('#image-count-badge');

  function handleFileSelect(files) {
    if (files && files.length > 0) {
      addStudentImages(files);
      showToast(`เพิ่มภาพเรียบร้อย (${files.length} ภาพ)`, 'success');
      if (addImagesInput) addImagesInput.value = '';
    }
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
      handleFileSelect(Array.from(e.target.files || []));
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
        <span class="badge badge-locked" title="หน้านี้ถูกล็อคให้อยู่หน้าแรกเสมอ">
          <span aria-hidden="true">🔒</span> หน้า 1
        </span>
        <span style="font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-primary);">ปกหน้า</span>
      </div>
      <p class="cover-description">ปกหน้าจะอยู่หน้าแรกเสมอ</p>
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
        <label for="front-template-select" class="form-label" style="font-size: var(--font-size-xs);">เปลี่ยนรูปแบบปก:</label>
        <select id="front-template-select" class="form-select select-sm" aria-label="เลือกรูปแบบปกหน้า">
          ${COVER_TEMPLATES.map(
            (t) => `<option value="${t.id}" ${t.id === state.frontCover.templateId ? 'selected' : ''}>${t.name}</option>`
          ).join('')}
        </select>
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
        <span class="badge badge-locked" title="หน้านี้ถูกล็อคให้อยู่หน้าสุดท้ายเสมอ">
          <span aria-hidden="true">🔒</span> หน้าสุดท้าย
        </span>
        <span style="font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-primary);">ปกหลัง</span>
      </div>
      <p class="cover-description">ปกหลังจะอยู่หน้าสุดท้ายเสมอ</p>
      <div class="cover-card-body">
        <div class="cover-visual-preview cover-back-theme" style="--accent: ${template.accentColor}">
          <div class="cover-inner-content">
            <div class="back-cover-motto">"เรียนดี มีวินัย ใฝ่เรียนรู้ สู่คุณธรรม"</div>
            <div class="cover-school-tag">โรงเรียนบ้านวังวน</div>
            <div class="cover-student-sub" style="margin-top: 4px;">สำนักงานเขตพื้นที่การศึกษาประถมศึกษา</div>
          </div>
        </div>
      </div>
      <div class="card-footer locked-footer">
        <label for="back-template-select" class="form-label" style="font-size: var(--font-size-xs);">เปลี่ยนรูปแบบปก:</label>
        <select id="back-template-select" class="form-select select-sm" aria-label="เลือกรูปแบบปกหลัง">
          ${COVER_TEMPLATES.map(
            (t) => `<option value="${t.id}" ${t.id === state.backCover.templateId ? 'selected' : ''}>${t.name}</option>`
          ).join('')}
        </select>
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
    const totalPages = images.length + 2;

    renderFrontCover(state);
    renderStudentImages(images);
    renderBackCover(state, totalPages);

    if (imageCountBadge) {
      imageCountBadge.textContent = `${images.length} ภาพผลงาน`;
    }
    if (totalPagesBadge) {
      totalPagesBadge.textContent = `${totalPages} หน้า รวมปกหน้าและปกหลัง`;
    }
  });

  // Initial render
  const initialState = projectStore.getState();
  renderFrontCover(initialState);
  renderStudentImages(initialState.images);
  renderBackCover(initialState, (initialState.images?.length || 0) + 2);
}
