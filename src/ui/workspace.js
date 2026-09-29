/**
 * Portfolio Workspace Component (Phase 2 Design System)
 * Orchestrates the visual sequence:
 * [Locked Front Cover (Page 1)] -> [Empty Image State / Student Images] -> [Locked Back Cover (Last Page)]
 */
import { projectStore } from '../portfolio/portfolio-state.js';
import { importStudentImages } from '../portfolio/image-manager.js';
import { createImageCard } from './image-card.js';
import { COVER_TEMPLATES, getCoverTemplate } from '../portfolio/cover-manager.js';
import { showToast } from './notifications.js';
import { openModal, closeModal } from './modal.js';

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

  // Drag and drop onto workspaceElement and emptyPlaceholder
  const dropTargets = [workspaceElement, emptyPlaceholder].filter(Boolean);
  dropTargets.forEach((target) => {
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      target.classList.add('is-dragover');
    });

    target.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      target.classList.remove('is-dragover');
    });

    target.addEventListener('drop', (e) => {
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
