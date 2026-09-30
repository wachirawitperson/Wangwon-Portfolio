/**
 * Wangwon Portfolio - Theme Manager (Phase 7)
 * Single source of truth for the application UI theme ('light' | 'dark').
 *
 * Requirements:
 * - Light mode is the default.
 * - Dark mode is optional.
 * - Persisted in localStorage ('wangwon-portfolio-theme').
 * - Zero student/project data stored in localStorage.
 * - Isolated from document canvas rendering (Cover Generator, PDF, etc.).
 */

export const THEME_STORAGE_KEY = 'wangwon-portfolio-theme';
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

const listeners = new Set();
let currentTheme = THEMES.LIGHT;

/**
 * Returns the currently active theme.
 * @returns {'light'|'dark'}
 */
export function getTheme() {
  return currentTheme;
}

/**
 * Applies the theme to the root <html> element and persists to localStorage.
 * Notifies all registered subscribers.
 *
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
  if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
    theme = THEMES.LIGHT;
  }

  currentTheme = theme;

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // Gracefully handle sandboxed environments with storage disabled
  }

  listeners.forEach((listener) => {
    try {
      listener(currentTheme);
    } catch (err) {
      console.error('Theme listener error:', err);
    }
  });

  updateThemeToggleUI();
}

/**
 * Toggles between 'light' and 'dark' themes.
 * @returns {'light'|'dark'} The newly active theme.
 */
export function toggleTheme() {
  const nextTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  setTheme(nextTheme);
  return nextTheme;
}

/**
 * Subscribes to theme changes.
 * @param {(theme: 'light'|'dark') => void} listener
 * @returns {() => void} Unsubscribe function
 */
export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Updates the theme toggle button's icon and accessible aria attributes.
 */
export function updateThemeToggleUI() {
  if (typeof document === 'undefined') return;

  const toggleBtn = document.querySelector('#btn-theme-toggle');
  const toggleIcon = document.querySelector('#theme-toggle-icon');
  const toggleText = document.querySelector('.theme-toggle-text');
  if (!toggleBtn) return;

  const isDark = currentTheme === THEMES.DARK;

  // Accessible labels in Thai
  toggleBtn.setAttribute('aria-label', isDark ? 'เปิดโหมดสว่าง' : 'เปิดโหมดมืด');
  toggleBtn.setAttribute('title', isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด');
  toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  toggleBtn.setAttribute('data-theme-state', currentTheme);

  if (toggleText) {
    toggleText.textContent = isDark ? 'โหมดสว่าง' : 'โหมดมืด';
  }

  if (toggleIcon) {
    if (isDark) {
      // Sun icon (click to switch to light)
      toggleIcon.innerHTML = `
        <svg class="icon-inline theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      `;
    } else {
      // Moon icon (click to switch to dark)
      toggleIcon.innerHTML = `
        <svg class="icon-inline theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      `;
    }
  }
}

/**
 * Initializes the theme on application load.
 * Reads stored preference from localStorage (defaults to 'light').
 */
export function initTheme() {
  let savedTheme = THEMES.LIGHT;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === THEMES.LIGHT || stored === THEMES.DARK) {
      savedTheme = stored;
    }
  } catch (e) {
    // ignore
  }

  setTheme(savedTheme);

  // Wire header toggle button if present
  const toggleBtn = document.querySelector('#btn-theme-toggle');
  if (toggleBtn && !toggleBtn._hasThemeListener) {
    toggleBtn._hasThemeListener = true;
    toggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }
}
