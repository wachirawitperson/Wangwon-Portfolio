/**
 * Accessible Modal / Dialog Foundation
 * Supports focus trapping, ESC key listener, ARIA labelling, and focus restoration.
 */

let activeModal = null;
let lastFocusedElement = null;

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex="0"]'
].join(', ');

export function openModal(modalElement, triggerElement = null) {
  if (!modalElement) return;

  lastFocusedElement = triggerElement || document.activeElement;
  activeModal = modalElement;

  modalElement.classList.add('is-open');
  modalElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  // Trap focus
  const focusables = Array.from(modalElement.querySelectorAll(FOCUSABLE_SELECTORS));
  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];

  if (firstFocusable) {
    firstFocusable.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(modalElement);
      return;
    }

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }
  }

  modalElement._keyHandler = handleKeyDown;
  document.addEventListener('keydown', handleKeyDown);

  // Overlay click to close
  function handleBackdropClick(e) {
    if (e.target === modalElement) {
      closeModal(modalElement);
    }
  }
  modalElement._backdropHandler = handleBackdropClick;
  modalElement.addEventListener('click', handleBackdropClick);

  // Close buttons inside modal
  const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
  closeButtons.forEach((btn) => {
    btn.onclick = () => closeModal(modalElement);
  });
}

export function closeModal(modalElement = activeModal) {
  if (!modalElement) return;

  modalElement.classList.remove('is-open');
  modalElement.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (modalElement._keyHandler) {
    document.removeEventListener('keydown', modalElement._keyHandler);
    delete modalElement._keyHandler;
  }

  if (modalElement._backdropHandler) {
    modalElement.removeEventListener('click', modalElement._backdropHandler);
    delete modalElement._backdropHandler;
  }

  // Restore focus to triggering element
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }

  activeModal = null;
}
