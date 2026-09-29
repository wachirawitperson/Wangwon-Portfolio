/**
 * Accessible Toast Notifications
 * Displays transient feedback messages for teachers without external dependencies.
 */

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'ข้อความแจ้งเตือน');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3000) {
  const host = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  host.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}
