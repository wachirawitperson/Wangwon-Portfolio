/**
 * Wangwon Portfolio - Recovery Modal Component (Phase 12)
 * Coordinates startup draft recovery, summary presentation,
 * user confirmation, and project hydration.
 */

import {
  loadDraft,
  deleteDraft,
  rehydrateDraftState
} from '../core/draft-storage.js';
import { autosaveManager } from '../core/autosave-manager.js';
import { hydrateProjectState } from '../portfolio/portfolio-state.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './notifications.js';
import { getStudentDisplayName } from '../core/student-utils.js';

/**
 * Initializes the recovery modal and checks for an existing saved draft.
 * If a draft is found, prompts the teacher to either continue or start new.
 */
export async function initRecoveryModal() {
  const recoveryModal = document.querySelector('#recovery-modal');
  const discardModal = document.querySelector('#discard-draft-modal');

  if (!recoveryModal) return;

  const studentNameEl = recoveryModal.querySelector('#recovery-student-name');
  const studentGradeEl = recoveryModal.querySelector('#recovery-student-grade');
  const imagesCountEl = recoveryModal.querySelector('#recovery-images-count');
  const savedTimeEl = recoveryModal.querySelector('#recovery-saved-time');

  const btnContinue = recoveryModal.querySelector('#btn-recovery-continue');
  const btnDiscard = recoveryModal.querySelector('#btn-recovery-discard');

  const btnCancelDiscard = discardModal?.querySelector('#btn-cancel-discard-draft');
  const btnConfirmDiscard = discardModal?.querySelector('#btn-confirm-discard-draft');

  let currentDraftRecord = null;

  try {
    currentDraftRecord = await loadDraft();
  } catch (err) {
    console.error('[RecoveryModal] Failed to check for draft:', err);
    return;
  }

  if (!currentDraftRecord || !currentDraftRecord.project) {
    // No saved draft; start blank project silently
    return;
  }

  // Populate recovery summary details
  const proj = currentDraftRecord.project;
  const student = proj.student || {};
  const displayName = getStudentDisplayName(student);

  if (studentNameEl) {
    studentNameEl.textContent = displayName || 'ไม่ได้ระบุชื่อ';
  }
  if (studentGradeEl) {
    studentGradeEl.textContent = student.grade || '-';
  }
  if (imagesCountEl) {
    const count = Array.isArray(proj.images) ? proj.images.length : 0;
    imagesCountEl.textContent = `${count} ภาพ`;
  }
  if (savedTimeEl) {
    if (currentDraftRecord.savedAt) {
      const d = new Date(currentDraftRecord.savedAt);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      savedTimeEl.textContent = `${hours}:${mins} น.`;
    } else {
      savedTimeEl.textContent = '-';
    }
  }

  // Open recovery modal (requires user choice)
  openModal(recoveryModal);

  // Override Escape key on recovery modal so Escape does not discard the draft
  const originalKeyHandler = recoveryModal._keyHandler;
  if (originalKeyHandler) {
    document.removeEventListener('keydown', originalKeyHandler);
    const safeKeyHandler = (e) => {
      if (e.key === 'Escape') {
        // Prevent accidental draft discard on Escape; teacher must make an explicit choice
        e.preventDefault();
        return;
      }
      originalKeyHandler(e);
    };
    recoveryModal._keyHandler = safeKeyHandler;
    document.addEventListener('keydown', safeKeyHandler);
  }

  // Handle "ทำงานต่อ" (Continue)
  if (btnContinue) {
    btnContinue.addEventListener('click', async () => {
      try {
        autosaveManager.pause();

        const restoredState = rehydrateDraftState(currentDraftRecord);
        hydrateProjectState(restoredState);

        closeModal(recoveryModal);
        showToast('กู้คืนงานที่บันทึกไว้แล้ว', 'success');

        // Resume autosave tracking
        autosaveManager.resume();
        autosaveManager.setStatus('saved');
      } catch (err) {
        console.error('[RecoveryModal] Failed to restore draft state:', err);
        showToast('เกิดข้อผิดพลาดในการกู้คืนงาน', 'danger');
        autosaveManager.resume();
      }
    });
  }

  // Handle "เริ่มใหม่" (Open Discard Confirmation)
  if (btnDiscard && discardModal) {
    btnDiscard.addEventListener('click', () => {
      openModal(discardModal, btnDiscard);
    });
  }

  // Handle Discard Confirmation "ยกเลิก"
  if (btnCancelDiscard && discardModal) {
    btnCancelDiscard.addEventListener('click', () => {
      closeModal(discardModal);
      if (btnDiscard) btnDiscard.focus();
    });
  }

  // Handle Discard Confirmation "ลบร่างและเริ่มใหม่"
  if (btnConfirmDiscard && discardModal) {
    btnConfirmDiscard.addEventListener('click', async () => {
      try {
        await deleteDraft();
        closeModal(discardModal);
        closeModal(recoveryModal);
        showToast('ลบร่างงานเดิมแล้ว เริ่มทำแฟ้มใหม่', 'info');
      } catch (err) {
        console.error('[RecoveryModal] Failed to delete draft:', err);
        showToast('ไม่สามารถลบร่างงานได้', 'danger');
      }
    });
  }
}
