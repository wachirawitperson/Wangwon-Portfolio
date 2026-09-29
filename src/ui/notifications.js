/**
 * Accessible Toast Notification Foundation
 * Displays non-blocking, transient feedback messages for teachers (success, info, warning, error).
 */

let container = null;

const TOAST_ICONS = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕'
};

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'ข้อความแจ้งเตือนของระบบ');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message - Message text
 * @param {'success'|'info'|'warning'|'error'} type - Toast type
 * @param {number} duration - Milliseconds before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3500) {
  const host = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  const icon = TOAST_ICONS[type] || 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
    <button type="button" class="toast-close" aria-label="ปิดการแจ้งเตือน" tabindex="0">✕</button>
  `;

  host.appendChild(toast);

  function removeToast() {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  }

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', removeToast);
  }

  setTimeout(removeToast, duration);
  return toast;
}
