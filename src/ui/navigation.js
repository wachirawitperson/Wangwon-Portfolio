/**
 * Wangwon Portfolio - Step-by-Step Navigation Controller
 * Manages transient wizard UI state: Section 1 (Student), Section 2 (Workspace/Images), Section 3 (Review/Preview/Export).
 * Source of truth for project content remains `projectStore`.
 */
import { validateAndHighlightStudentForm } from './student-form.js';
import { showToast } from './notifications.js';

let currentSection = 1;
const listeners = new Set();

export function getCurrentSection() {
  return currentSection;
}

export function subscribeNavigation(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyNavigation() {
  listeners.forEach((fn) => {
    try {
      fn(currentSection);
    } catch (e) {
      console.error('[Navigation] Listener error:', e);
    }
  });
}

/**
 * Validates whether the user can navigate away from Section 1.
 * @returns {boolean}
 */
export function validateSection1() {
  const result = validateAndHighlightStudentForm();
  if (!result.valid) {
    showToast('กรุณากรอกข้อมูลนักเรียนที่จำเป็นให้ครบถ้วนก่อนไปขั้นตอนถัดไป', 'warning');
    if (result.firstInvalidElement) {
      result.firstInvalidElement.focus();
    }
    return false;
  }
  return true;
}

/**
 * Navigates to a specific section.
 * @param {number} sectionNum - 1, 2, or 3
 * @param {object} [options]
 * @param {boolean} [options.skipValidation=false] - For programmatic/test use or backward transitions
 * @returns {boolean} True if navigation succeeded
 */
export function goToSection(sectionNum, { skipValidation = false } = {}) {
  const target = Math.min(3, Math.max(1, parseInt(sectionNum, 10) || 1));

  if (target === currentSection) return true;

  // Moving forward from Section 1 requires validation
  if (currentSection === 1 && target > 1 && !skipValidation) {
    if (!validateSection1()) {
      return false;
    }
  }

  // Moving forward from Section 2 to Section 3: validate Section 1 as well
  if (currentSection === 2 && target === 3 && !skipValidation) {
    if (!validateSection1()) {
      return false;
    }
  }

  currentSection = target;
  applySectionVisibility();
  notifyNavigation();
  return true;
}

export function nextSection() {
  return goToSection(currentSection + 1);
}

export function prevSection() {
  return goToSection(currentSection - 1, { skipValidation: true });
}

/**
 * Updates DOM to reflect the active section in the 3-step navigator and sections.
 */
function applySectionVisibility() {
  // 1. Update Step Navigator items
  const navItems = document.querySelectorAll('.step-navigator .step-item');
  navItems.forEach((item) => {
    const step = parseInt(item.dataset.step, 10);
    item.classList.remove('is-active', 'is-completed');
    item.removeAttribute('aria-current');

    const stepNumEl = item.querySelector('.step-number');

    if (step === currentSection) {
      item.classList.add('is-active');
      item.setAttribute('aria-current', 'step');
      if (stepNumEl) stepNumEl.textContent = String(step);
    } else if (step < currentSection) {
      item.classList.add('is-completed');
      if (stepNumEl) stepNumEl.textContent = '✓';
    } else {
      if (stepNumEl) stepNumEl.textContent = String(step);
    }
  });

  // 2. Update step sections
  const sec1 = document.querySelector('#student-section');
  const sec2 = document.querySelector('#portfolio-workspace');
  const sec3 = document.querySelector('#section-review-export');
  const workspaceContainer = document.querySelector('#workspace-layout-container');

  if (sec1) {
    sec1.hidden = currentSection !== 1;
    sec1.classList.toggle('is-active-section', currentSection === 1);
  }

  if (sec2) {
    sec2.hidden = currentSection !== 2;
    sec2.classList.toggle('is-active-section', currentSection === 2);
  }

  if (sec3) {
    sec3.hidden = currentSection !== 3;
    sec3.classList.toggle('is-active-section', currentSection === 3);
  }

  if (workspaceContainer) {
    workspaceContainer.hidden = currentSection !== 2;
    workspaceContainer.classList.toggle('is-active-section', currentSection === 2);
  }

  // Primary action toolbar: permanently hidden in Phase 18.5 across all sections
  const actionToolbar = document.querySelector('#action-toolbar');
  if (actionToolbar) {
    actionToolbar.hidden = true;
    actionToolbar.classList.add('is-hidden');
    actionToolbar.setAttribute('aria-hidden', 'true');
  }

  // Hero section compact state when leaving Section 1
  const heroSection = document.querySelector('#section1-hero');
  if (heroSection) {
    heroSection.classList.toggle('is-compact', currentSection !== 1);
  }

  // Dispatch custom window event and resize event to trigger layout/overlay updates
  window.dispatchEvent(
    new CustomEvent('wangwon:section-changed', {
      detail: { section: currentSection }
    })
  );
  window.dispatchEvent(new Event('resize'));
}

/**
 * Initializes the Step Navigator and wizard buttons.
 */
export function initNavigation() {
  // Step navigator click listeners
  const navItems = document.querySelectorAll('.step-navigator .step-item');
  navItems.forEach((item) => {
    const step = parseInt(item.dataset.step, 10);

    if (!item.hasAttribute('role')) {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
    }

    const handleClick = () => {
      if (step < currentSection) {
        goToSection(step, { skipValidation: true });
      } else if (step > currentSection) {
        goToSection(step);
      }
    };

    item.addEventListener('click', handleClick);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
  });

  // Section 1: Next button
  const btnStep1Next = document.querySelector('#btn-step1-next');
  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', () => {
      nextSection();
    });
  }

  // Section 2: Prev & Next buttons
  const btnStep2Prev = document.querySelector('#btn-step2-prev');
  if (btnStep2Prev) {
    btnStep2Prev.addEventListener('click', () => {
      prevSection();
    });
  }

  const btnStep2Next = document.querySelector('#btn-step2-next');
  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', () => {
      nextSection();
    });
  }

  // Section 3: Prev button
  const btnStep3Prev = document.querySelector('#btn-step3-prev');
  if (btnStep3Prev) {
    btnStep3Prev.addEventListener('click', () => {
      prevSection();
    });
  }

  // Initial apply
  applySectionVisibility();
}
